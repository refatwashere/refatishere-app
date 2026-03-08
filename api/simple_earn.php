<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') send_json(['ok'=>true], 204);
require_token();

$pdo = db();
if ($pdo) {
    try {
        $stmt = $pdo->query('SELECT * FROM simple_earn ORDER BY start_date DESC');
        send_json(success_envelope($stmt->fetchAll()));
    } catch (Throwable $e) {}
}
send_json(success_envelope(sample_simple_earn()));
