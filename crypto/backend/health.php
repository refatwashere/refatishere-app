<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$missing = [];
if (!(crypto_env('API_TOKEN_CRYPTO') || crypto_env('API_TOKEN'))) $missing[] = 'API_TOKEN_CRYPTO';
if (!crypto_env('BINANCE_BASE_URL')) $missing[] = 'BINANCE_BASE_URL';

$sidecarConfigured = crypto_env('PLANNER_SIDECAR_URL', '') !== '';
$sidecarReachable = false;
if ($sidecarConfigured) {
    $health = planner_sidecar_health();
    $sidecarReachable = is_array($health);
}

$dbReady = crypto_db() instanceof PDO;

crypto_json(crypto_success([
    'service' => 'crypto-backend',
    'ready' => count($missing) === 0,
    'checked_at' => gmdate('c')
], ['meta' => [
    'missing_count' => count($missing),
    'missing' => $missing,
    'db_ready' => $dbReady,
    'sidecar_configured' => $sidecarConfigured,
    'sidecar_reachable' => $sidecarReachable
]]), count($missing) === 0 ? 200 : 500);
