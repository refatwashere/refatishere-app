<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') send_json(['ok'=>true], 204);
require_token();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function get_journal_rows(): array {
    $pdo = db();
    if ($pdo) {
        try {
            $stmt = $pdo->query('SELECT id, symbol, side, entry_price, exit_price, qty, pnl, setup_tag, notes, created_at FROM journal_entries ORDER BY id DESC LIMIT 500');
            return $stmt->fetchAll();
        } catch (Throwable $e) {}
    }
    return sample_journal();
}

if ($method === 'GET') {
    send_json(success_envelope(get_journal_rows()));
}

if ($method === 'POST') {
    $body = read_json_body();
    foreach (['symbol','side','entry','exit','qty','pnl'] as $field) {
        if (!isset($body[$field]) || $body[$field] === '') error_envelope("Missing field: $field", 422, "missing_$field");
    }

    $row = [
        'id' => random_int(1000,9999),
        'symbol' => strtoupper((string)$body['symbol']),
        'side' => strtoupper((string)$body['side']),
        'entry_price' => (float)$body['entry'],
        'exit_price' => (float)$body['exit'],
        'qty' => (float)$body['qty'],
        'pnl' => (float)$body['pnl'],
        'setup_tag' => $body['setupTag'] ?? null,
        'notes' => $body['notes'] ?? null,
        'created_at' => gmdate('c')
    ];

    $pdo = db();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare('INSERT INTO journal_entries (symbol, side, entry_price, exit_price, qty, pnl, setup_tag, notes) VALUES (:symbol,:side,:entry_price,:exit_price,:qty,:pnl,:setup_tag,:notes)');
            $stmt->execute([
                ':symbol' => $row['symbol'],
                ':side' => $row['side'],
                ':entry_price' => $row['entry_price'],
                ':exit_price' => $row['exit_price'],
                ':qty' => $row['qty'],
                ':pnl' => $row['pnl'],
                ':setup_tag' => $row['setup_tag'],
                ':notes' => $row['notes']
            ]);
            $row['id'] = (int)$pdo->lastInsertId();
        } catch (Throwable $e) {
            error_envelope('Persistence failure.', 500, 'persistence_failed');
        }
    }

    send_json(success_envelope($row), 201);
}

error_envelope('Method not allowed.', 405, 'method_not_allowed');
