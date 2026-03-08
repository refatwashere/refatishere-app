<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') send_json(['ok'=>true], 204);
require_token();

$pdo = db();
if ($pdo) {
    try {
        $stmt = $pdo->query('SELECT * FROM campaigns ORDER BY id DESC');
        send_json(success_envelope($stmt->fetchAll()));
    } catch (Throwable $e) {}
}
send_json(success_envelope(sample_campaigns()));
