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

function env_value(string $key, ?string $default = null): ?string {
    $value = $_ENV[$key] ?? getenv($key);
    return ($value === false || $value === null || $value === '') ? $default : (string)$value;
}

function request_id(): string {
    $incoming = $_SERVER['HTTP_X_REQUEST_ID'] ?? '';
    if ($incoming !== '' && preg_match('/^[A-Za-z0-9._:-]{8,64}$/', $incoming)) return $incoming;
    return bin2hex(random_bytes(8));
}

function cors_headers(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Token, X-Request-Id');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('X-Request-Id: ' . request_id());
}

function send_json($payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    cors_headers();
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function success_envelope($data, array $extra = []): array {
    return array_merge(['status' => 'success', 'data' => $data], $extra);
}

function error_envelope(string $message, int $status = 400, ?string $error = null): void {
    send_json([
        'status' => 'error',
        'message' => $message,
        'error' => $error ?? $message,
        'request_id' => request_id()
    ], $status);
}

function require_token(string $expectedEnv = 'API_TOKEN_LEGACY'): void {
    $expected = env_value($expectedEnv, env_value('API_TOKEN', ''));
    if ($expected === '') error_envelope('Server not configured.', 500, 'not_configured');
    $given = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    if ($given !== $expected) error_envelope('Unauthorized token.', 401, 'unauthorized');
}

function read_json_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) error_envelope('Invalid JSON payload.', 400, 'invalid_json');
    return $decoded;
}

function db(): ?PDO {
    static $pdo = null;
    static $failed = false;
    if ($pdo instanceof PDO) return $pdo;
    if ($failed) return null;
    try {
        $pdo = new PDO(
            sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                env_value('DB_HOST', 'localhost'),
                env_value('DB_PORT', '3306'),
                env_value('DB_NAME', 'refatishere'),
                env_value('DB_CHARSET', 'utf8mb4')
            ),
            env_value('DB_USER', 'root'),
            env_value('DB_PASS', ''),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        return $pdo;
    } catch (Throwable $e) {
        $failed = true;
        return null;
    }
}

function sample_campaigns(): array {
    return [
        ['id'=>1,'name'=>'Momentum Sprint','status'=>'active','created_at'=>'2026-03-05'],
        ['id'=>2,'name'=>'Journal Discipline','status'=>'draft','created_at'=>'2026-03-02']
    ];
}
function sample_simple_earn(): array {
    return [
        ['id'=>1,'asset'=>'USDT','apr'=>0.042,'start_date'=>'2026-03-01','status'=>'active'],
        ['id'=>2,'asset'=>'BNB','apr'=>0.018,'start_date'=>'2026-02-20','status'=>'active']
    ];
}
function sample_trades(): array {
    return [
        ['id'=>1,'pair'=>'BTCUSDT','quantity'=>0.0100,'entry_price'=>64250.55,'exit_price'=>65490.55,'fees'=>3.25,'learnings'=>'Momentum continuation','created_at'=>'2026-03-05T08:20:00Z'],
        ['id'=>2,'pair'=>'ETHUSDT','quantity'=>0.5000,'entry_price'=>3188.10,'exit_price'=>3171.60,'fees'=>2.10,'learnings'=>'Late entry, weak follow-through','created_at'=>'2026-03-06T11:10:00Z']
    ];
}
function sample_journal(): array {
    return [
        ['id'=>1,'symbol'=>'BTCUSDT','side'=>'BUY','entry_price'=>63120,'exit_price'=>64010,'qty'=>0.01,'pnl'=>8.9,'setup_tag'=>'EMA pullback','notes'=>'Clean continuation','created_at'=>'2026-03-05T12:00:00Z']
    ];
}
