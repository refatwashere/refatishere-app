<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') send_json(['ok'=>true], 204);
require_token();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function get_trade_rows(): array {
    $pdo = db();
    if ($pdo) {
        try {
            $stmt = $pdo->query('SELECT id, pair, quantity, entry_price, exit_price, fees, learnings, created_at FROM trades ORDER BY id DESC LIMIT 500');
            return $stmt->fetchAll();
        } catch (Throwable $e) {}
    }
    return sample_trades();
}

if ($method === 'GET') {
    $rows = get_trade_rows();
    $hasEnhanced = isset($_GET['page']) || isset($_GET['limit']) || isset($_GET['from']) || isset($_GET['to']) || isset($_GET['sort']);

    if (!$hasEnhanced) send_json($rows);

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(200, max(1, (int)($_GET['limit'] ?? 25)));
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $sort = (string)($_GET['sort'] ?? 'id_desc');
    $validSorts = ['id_asc','id_desc','entry_price_asc','entry_price_desc','exit_price_asc','exit_price_desc','created_at_asc','created_at_desc'];

    if ($from && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$from)) error_envelope('Invalid from date.', 422, 'invalid_from');
    if ($to && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$to)) error_envelope('Invalid to date.', 422, 'invalid_to');
    if (!in_array($sort, $validSorts, true)) error_envelope('Invalid sort parameter.', 422, 'invalid_sort');

    if ($from) $rows = array_values(array_filter($rows, fn($r) => substr((string)$r['created_at'],0,10) >= $from));
    if ($to) $rows = array_values(array_filter($rows, fn($r) => substr((string)$r['created_at'],0,10) <= $to));

    usort($rows, function($a, $b) use ($sort) {
        [$field, $dir] = explode('_', $sort, 2);
        $key = match($field) {
            'id' => 'id',
            'entry' => 'entry_price',
            'exit' => 'exit_price',
            'created' => 'created_at',
            default => 'id'
        };
        $cmp = ($a[$key] <=> $b[$key]);
        return $dir === 'asc' ? $cmp : -$cmp;
    });

    $total = count($rows);
    $totalPages = max(1, (int)ceil($total / $limit));
    $offset = ($page - 1) * $limit;
    $slice = array_slice($rows, $offset, $limit);

    send_json(success_envelope($slice, [
        'meta' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages,
            'sort' => $sort,
            'filters' => ['from' => $from, 'to' => $to]
        ]
    ]));
}

if ($method === 'POST') {
    $body = read_json_body();
    $pair = strtoupper(trim((string)($body['pair'] ?? '')));
    $quantity = (float)($body['quantity'] ?? 0);
    $entryPrice = (float)($body['entryPrice'] ?? 0);
    $exitPrice = (float)($body['exitPrice'] ?? 0);
    $fees = (float)($body['fees'] ?? 0);
    $learnings = trim((string)($body['learnings'] ?? ''));

    if ($pair === '' || !preg_match('/^[A-Z0-9._-]{3,20}(\/[A-Z0-9._-]{2,20})?$/', $pair)) error_envelope('Invalid pair.', 422, 'invalid_pair');
    foreach ([$quantity, $entryPrice, $exitPrice] as $num) if ($num <= 0 || $num > 100000000) error_envelope('Numeric payload out of bounds.', 422, 'invalid_numeric');
    if ($fees < 0 || $fees > 100000000) error_envelope('Invalid fees.', 422, 'invalid_fees');

    $row = [
        'id' => random_int(1000, 9999),
        'pair' => $pair,
        'quantity' => $quantity,
        'entry_price' => $entryPrice,
        'exit_price' => $exitPrice,
        'fees' => $fees,
        'learnings' => $learnings,
        'created_at' => gmdate('c')
    ];

    $pdo = db();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare('INSERT INTO trades (pair, quantity, entry_price, exit_price, fees, learnings) VALUES (:pair,:quantity,:entry_price,:exit_price,:fees,:learnings)');
            $stmt->execute([
                ':pair' => $pair,
                ':quantity' => $quantity,
                ':entry_price' => $entryPrice,
                ':exit_price' => $exitPrice,
                ':fees' => $fees,
                ':learnings' => $learnings
            ]);
            $row['id'] = (int)$pdo->lastInsertId();
        } catch (Throwable $e) {
            error_envelope('Persistence failure.', 500, 'persistence_failed');
        }
    }

    send_json(success_envelope($row), 201);
}

error_envelope('Method not allowed.', 405, 'method_not_allowed');
