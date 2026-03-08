<?php
declare(strict_types=1);

function load_env_file(string $file): void {
    if (!is_file($file)) return;
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        $value = trim($value, "\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}
load_env_file(__DIR__ . '/.env');

function crypto_env(string $key, ?string $default = null): ?string {
    $value = $_ENV[$key] ?? getenv($key);
    return ($value === false || $value === null || $value === '') ? $default : (string)$value;
}

function crypto_request_id(): string {
    $incoming = $_SERVER['HTTP_X_REQUEST_ID'] ?? '';
    if ($incoming !== '' && preg_match('/^[A-Za-z0-9._:-]{8,64}$/', $incoming)) return $incoming;
    return bin2hex(random_bytes(8));
}

function crypto_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Token, X-Request-Id, X-Planner-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('X-Request-Id: ' . crypto_request_id());
}

function crypto_json($payload, int $status = 200): void {
    http_response_code($status);
    crypto_headers();
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function crypto_success($data, array $extra = []): array {
    return array_merge(['status' => 'success', 'success' => true, 'data' => $data], $extra);
}

function crypto_error(string $message, int $status = 400, ?string $error = null, array $data = []): void {
    crypto_json([
        'status' => 'error',
        'success' => false,
        'message' => $message,
        'error' => $error ?? $message,
        'request_id' => crypto_request_id(),
        'data' => $data
    ], $status);
}

function crypto_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) crypto_error('Invalid JSON payload.', 400, 'invalid_json');
    return $decoded;
}

function require_crypto_token(): void {
    $expected = crypto_env('API_TOKEN_CRYPTO', crypto_env('API_TOKEN', ''));
    if ($expected === '') crypto_error('Server not configured.', 500, 'not_configured');
    $given = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    if ($given !== $expected) crypto_error('Unauthorized token.', 401, 'unauthorized');
}

function clamp_recv_window($value): int {
    $num = (int)$value;
    if ($num < 1) $num = 1;
    if ($num > 60000) $num = 60000;
    return $num;
}

function source_state(string $state): array {
    return ['sourceState' => $state, 'timestamp' => gmdate('c')];
}

function crypto_db(): ?PDO {
    static $pdo = null;
    static $failed = false;
    if ($pdo instanceof PDO) return $pdo;
    if ($failed) return null;
    try {
        $pdo = new PDO(
            sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                crypto_env('DB_HOST', 'localhost'),
                crypto_env('DB_PORT', '3306'),
                crypto_env('DB_NAME', 'refatishere'),
                crypto_env('DB_CHARSET', 'utf8mb4')
            ),
            crypto_env('DB_USER', 'root'),
            crypto_env('DB_PASS', ''),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        return $pdo;
    } catch (Throwable $e) {
        $failed = true;
        return null;
    }
}

function is_cache_symbol(string $symbol): bool {
    return in_array($symbol, ['BTCUSDT','BNBUSDT','ETHUSDT','DOGEUSDT'], true);
}

function get_cached_klines(string $symbol, string $interval): ?array {
    if (!is_cache_symbol($symbol)) return null;
    $pdo = crypto_db();
    if (!$pdo) return null;
    try {
        $stmt = $pdo->prepare('SELECT payload_json, expires_at FROM market_kline_cache WHERE symbol = :symbol AND interval_name = :interval LIMIT 1');
        $stmt->execute([':symbol' => $symbol, ':interval' => $interval]);
        $row = $stmt->fetch();
        if (!$row) return null;
        if (strtotime((string)$row['expires_at']) < time()) return null;
        $decoded = json_decode((string)$row['payload_json'], true);
        return is_array($decoded) ? $decoded : null;
    } catch (Throwable $e) {
        return null;
    }
}

function put_cached_klines(string $symbol, string $interval, array $payload, int $ttlSeconds = 86400): void {
    if (!is_cache_symbol($symbol)) return;
    $pdo = crypto_db();
    if (!$pdo) return;
    try {
        $expiresAt = gmdate('Y-m-d H:i:s', time() + $ttlSeconds);
        $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare(
            'INSERT INTO market_kline_cache (symbol, interval_name, payload_json, cached_at, expires_at)
             VALUES (:symbol, :interval, :payload, NOW(), :expires_at)
             ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), cached_at = NOW(), expires_at = VALUES(expires_at)'
        );
        $stmt->execute([
            ':symbol' => $symbol,
            ':interval' => $interval,
            ':payload' => $json,
            ':expires_at' => $expiresAt
        ]);
    } catch (Throwable $e) {}
}

function cleanup_market_kline_cache(): array {
    $pdo = crypto_db();
    if (!$pdo) return ['deleted' => 0, 'db' => 'unavailable'];
    try {
        $stmt = $pdo->prepare('DELETE FROM market_kline_cache WHERE expires_at < NOW()');
        $stmt->execute();
        return ['deleted' => $stmt->rowCount(), 'db' => 'ok'];
    } catch (Throwable $e) {
        return ['deleted' => 0, 'db' => 'error', 'message' => $e->getMessage()];
    }
}

function http_json_request(string $url, string $method = 'GET', array $headers = [], $body = null, ?string $contentType = null): ?array {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $normalizedHeaders = [];
        foreach ($headers as $k => $v) {
            $normalizedHeaders[] = is_string($k) ? ($k . ': ' . $v) : $v;
        }
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 6,
            CURLOPT_USERAGENT => 'refatishere-v9/1.0',
            CURLOPT_HTTPHEADER => $normalizedHeaders
        ]);
        $method = strtoupper($method);
        if ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($body !== null) {
                if ($contentType === 'application/x-www-form-urlencoded' && is_array($body)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($body, '', '&', PHP_QUERY_RFC3986));
                } else if (is_array($body)) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
                } else {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, (string)$body);
                }
            }
        }
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $decoded['_http_status'] = $status;
                return $decoded;
            }
        }

        return [
            '_failure' => true,
            '_http_status' => $status,
            '_curl_errno' => $errno,
            '_curl_error' => $error,
            '_raw' => is_string($raw) ? $raw : null
        ];
    }
    return [
        '_failure' => true,
        '_http_status' => 0,
        '_curl_errno' => -1,
        '_curl_error' => 'curl_unavailable'
    ];
}

function fetch_binance_klines(string $symbol, string $interval, int $limit = 100): ?array {
    $base = crypto_env('BINANCE_BASE_URL', 'https://api.binance.com');
    $url = rtrim($base, '/') . '/api/v3/klines?symbol=' . rawurlencode($symbol) . '&interval=' . rawurlencode($interval) . '&limit=' . max(20, min(500, $limit));
    $rows = http_json_request($url);
    if (!is_array($rows) || isset($rows['_failure']) || !$rows) return null;
    $out = [];
    foreach ($rows as $row) {
        if (!is_array($row) || count($row) < 6) continue;
        $out[] = ['time'=>(int)$row[0], 'open'=>(float)$row[1], 'high'=>(float)$row[2], 'low'=>(float)$row[3], 'close'=>(float)$row[4], 'volume'=>(float)$row[5]];
    }
    return $out ?: null;
}

function planner_sidecar_call(array $payload): ?array {
    $url = crypto_env('PLANNER_SIDECAR_URL', '');
    if ($url === '') return null;
    $token = crypto_env('PLANNER_SIDECAR_TOKEN', '');
    $res = http_json_request(
        rtrim($url, '/') . '/api/planner',
        'POST',
        ['Content-Type' => 'application/json', 'X-Planner-Token' => $token],
        $payload,
        'application/json'
    );
    if (!is_array($res) || isset($res['_failure'])) return null;
    return $res;
}

function planner_sidecar_health(): ?array {
    $url = crypto_env('PLANNER_SIDECAR_URL', '');
    if ($url === '') return null;
    $res = http_json_request(rtrim($url, '/') . '/api/health', 'GET');
    if (!is_array($res) || isset($res['_failure'])) return null;
    return $res;
}

function mock_klines(string $symbol): array {
    $base = str_contains($symbol, 'ETH') ? 3200.0 : (str_contains($symbol, 'BNB') ? 570.0 : (str_contains($symbol, 'DOGE') ? 0.18 : 64000.0));
    $rows=[]; $price=$base;
    for($i=0;$i<100;$i++){
        $drift=((mt_rand(0,1000)/1000)-0.48)*($base*0.003);
        $open=$price; $close=max(0.0001,$price+$drift);
        $high=max($open,$close)+($base*0.001*(mt_rand(0,1000)/1000));
        $low=min($open,$close)-($base*0.001*(mt_rand(0,1000)/1000));
        $rows[]=['time'=>(int)(microtime(true)*1000)-((100-$i)*60000),'open'=>$open,'high'=>$high,'low'=>$low,'close'=>$close,'volume'=>100+mt_rand(0,500)];
        $price=$close;
    }
    return $rows;
}

function binance_base_url(bool $useTestnet): string {
    return $useTestnet ? 'https://testnet.binance.vision' : crypto_env('BINANCE_BASE_URL', 'https://api.binance.com');
}

function binance_sign_params(array $params, string $secret): array {
    ksort($params);
    $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $params['signature'] = hash_hmac('sha256', $query, $secret);
    return $params;
}

function binance_signed_request(
    string $method,
    string $path,
    array $params,
    string $apiKey,
    string $apiSecret,
    bool $useTestnet,
    bool $signed = true
): array {
    $base = rtrim(binance_base_url($useTestnet), '/');
    $method = strtoupper($method);
    $headers = ['X-MBX-APIKEY' => $apiKey];
    $params['recvWindow'] = clamp_recv_window($params['recvWindow'] ?? 5000);
    if ($signed) {
        $params['timestamp'] = (int)floor(microtime(true) * 1000);
        $params = binance_sign_params($params, $apiSecret);
    }

    $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $url = $base . $path;
    $body = null;
    $contentType = 'application/x-www-form-urlencoded';

    if ($method === 'GET' || $method === 'DELETE') {
        $url .= '?' . $query;
    } else {
        $body = $params;
        $headers['Content-Type'] = $contentType;
    }

    $res = http_json_request($url, $method, $headers, $body, $contentType);
    if (!$res) {
        return ['ok' => false, 'error' => 'transport_unavailable'];
    }

    if (isset($res['_failure'])) {
        return [
            'ok' => false,
            'error' => 'binance_request_failed',
            'details' => $res,
            'request' => [
                'method' => $method,
                'url' => $url,
                'signed' => $signed,
                'recvWindow' => $params['recvWindow']
            ]
        ];
    }

    return [
        'ok' => true,
        'data' => $res,
        'request' => [
            'method' => $method,
            'url' => $url,
            'signed' => $signed,
            'recvWindow' => $params['recvWindow']
        ]
    ];
}
