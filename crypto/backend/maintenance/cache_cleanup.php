<?php
declare(strict_types=1);
require dirname(__DIR__) . '/bootstrap.php';
require_crypto_token();
crypto_json(crypto_success(cleanup_market_kline_cache(), ['meta' => array_merge(source_state('Proxy'), ['source' => 'maintenance_script'])]));
