<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
$ready = env_value('DB_HOST') && env_value('DB_USER') && env_value('DB_NAME') && env_value('API_TOKEN_LEGACY', env_value('API_TOKEN'));
$status = $ready ? 200 : 500;
send_json(success_envelope(['ready' => (bool)$ready, 'service' => 'legacy-api']), $status);
