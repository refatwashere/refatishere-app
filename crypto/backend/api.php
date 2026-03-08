<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') crypto_json(['ok'=>true], 204);
require_crypto_token();

$action = $_GET['action'] ?? '';
$body = crypto_body();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function require_private_credentials(array $body): array {
    foreach (['apiKey','apiSecret','useTestnet'] as $field) {
        if (!array_key_exists($field, $body)) crypto_error("Missing field: $field", 422, "missing_$field");
    }
    return [
        'apiKey' => (string)$body['apiKey'],
        'apiSecret' => (string)$body['apiSecret'],
        'useTestnet' => (bool)$body['useTestnet'],
        'recvWindow' => clamp_recv_window($body['recvWindow'] ?? 5000)
    ];
}

function binance_local_advisory(array $body): array {
    $symbol = strtoupper((string)($body['symbol'] ?? 'BTCUSDT'));
    $side = strtoupper((string)($body['side'] ?? 'BUY'));
    $size = (float)($body['size'] ?? 0);
    $type = strtoupper((string)($body['type'] ?? 'MARKET'));
    $marketPrice = (float)($body['marketPrice'] ?? 0);
    $confidence = $type === 'LIMIT' ? 0.66 : 0.62;
    return [
        'trade_intent' => [
            'venue' => 'binance',
            'symbol' => $symbol,
            'side' => $side,
            'size' => $size,
            'confidence' => $confidence,
            'rationale' => $side === 'BUY' ? 'Local heuristic is long-biased.' : 'Local heuristic is short-biased.',
            'risk_flags' => ['market_order_slippage']
        ],
        'risk_assessment' => [
            'score' => 38,
            'level' => 'medium',
            'flags' => ['market_order_slippage']
        ],
        'execution_plan' => [
            'mode' => 'assisted',
            'steps' => [
                ['step' => 1, 'description' => 'Review symbol, side, and size against your strategy.'],
                ['step' => 2, 'description' => 'Confirm invalidation before manual execution.']
            ],
            'deep_link' => str_contains($symbol, 'USDT') ? ('https://www.binance.com/en/trade/' . str_replace('USDT', '_USDT', $symbol) . '?type=spot') : null
        ],
        'meta' => [
            'source' => 'local_heuristic',
            'provider' => 'local',
            'venue' => 'binance',
            'planner_version' => '1.2.0',
            'market_price' => $marketPrice
        ]
    ];
}

function pancakeswap_local_advisory(array $body): array {
    $chainId = (int)($body['chainId'] ?? 56);
    $tokenIn = trim((string)($body['tokenIn'] ?? 'WBNB'));
    $tokenOut = trim((string)($body['tokenOut'] ?? 'USDT'));
    $amountIn = (float)($body['amountIn'] ?? 0);
    $slippageBps = (int)($body['slippageBps'] ?? 50);
    $routeType = (string)($body['routeType'] ?? 'auto');
    return [
        'trade_intent' => [
            'venue' => 'pancakeswap',
            'symbol' => $tokenIn . '/' . $tokenOut,
            'side' => strtoupper((string)($body['side'] ?? 'BUY')),
            'size' => $amountIn,
            'confidence' => 0.58,
            'rationale' => 'Local heuristic advisory for PancakeSwap route planning.',
            'risk_flags' => ['slippage', 'routing-risk', 'smart-contract-risk']
        ],
        'risk_assessment' => [
            'score' => 46,
            'level' => 'medium',
            'flags' => ['slippage', 'routing-risk', 'smart-contract-risk']
        ],
        'execution_plan' => [
            'mode' => 'assisted',
            'steps' => [
                ['step' => 1, 'description' => 'Verify route quality and pool liquidity.'],
                ['step' => 2, 'description' => 'Confirm slippage and chain before signing anything.']
            ],
            'deep_link' => 'https://pancakeswap.finance/swap'
        ],
        'meta' => [
            'source' => 'local_heuristic',
            'provider' => 'local',
            'venue' => 'pancakeswap',
            'planner_version' => '1.2.0',
            'chain_id' => $chainId,
            'slippage_bps' => $slippageBps,
            'route_type' => $routeType,
            'adapter' => 'local-fallback',
            'adapter_status' => 'local-only'
        ]
    ];
}

if ($action === 'klines') {
    $symbol = strtoupper((string)($body['symbol'] ?? 'BTCUSDT'));
    $interval = (string)($body['interval'] ?? '15m');
    $limit = (int)($body['limit'] ?? 100);

    if (!preg_match('/^[A-Z0-9]{5,20}$/', $symbol)) crypto_error('Invalid symbol.', 422, 'invalid_symbol');
    if (!in_array($interval, ['1m','5m','10m','15m','30m','1h','4h','1d'], true)) crypto_error('Invalid interval.', 422, 'invalid_interval');

    $live = fetch_binance_klines($symbol, $interval, $limit);
    if ($live) {
        put_cached_klines($symbol, $interval, $live, 86400);
        crypto_json(crypto_success($live, ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_klines'])]));
    }

    $cached = get_cached_klines($symbol, $interval);
    if ($cached) {
        crypto_json(crypto_success($cached, ['meta' => array_merge(source_state('Fallback'), ['source' => 'db_cache', 'cache_ttl_hours' => 24])]));
    }

    crypto_json(crypto_success(mock_klines($symbol), ['meta' => array_merge(source_state('Fallback'), ['source' => 'mock'])]));
}

if ($action === 'account') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $creds = require_private_credentials($body);
    if ($creds['apiKey'] !== '' && $creds['apiSecret'] !== '') {
        $live = binance_signed_request('GET', '/api/v3/account', [
            'recvWindow' => $creds['recvWindow']
        ], $creds['apiKey'], $creds['apiSecret'], $creds['useTestnet'], true);

        if ($live['ok'] ?? false) {
            crypto_json(crypto_success($live['data'], ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_signed'])]));
        }
    }

    crypto_json(crypto_success([
        'balances' => [
            ['asset' => 'USDT', 'free' => 1200.00],
            ['asset' => 'BTC', 'free' => 0.0512]
        ],
        'recvWindow' => $creds['recvWindow']
    ], ['meta' => array_merge(source_state('Degraded'), ['source' => 'mock_private'])]));
}

if ($action === 'order') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $creds = require_private_credentials($body);
    foreach (['symbol','side','type','quantity'] as $field) if (!isset($body[$field]) || $body[$field] === '') crypto_error("Missing field: $field", 422, "missing_$field");
    $symbol = strtoupper((string)$body['symbol']);
    $side = strtoupper((string)$body['side']);
    $type = strtoupper((string)$body['type']);
    $quantity = (float)$body['quantity'];
    $price = isset($body['price']) && $body['price'] !== '' ? (float)$body['price'] : null;
    $clientOrderId = trim((string)($body['newClientOrderId'] ?? ('client_' . bin2hex(random_bytes(6)))));
    $dryRun = isset($body['dryRun']) ? (bool)$body['dryRun'] : true;

    if (!in_array($side, ['BUY','SELL'], true)) crypto_error('Invalid side.', 422, 'invalid_side');
    if (!in_array($type, ['MARKET','LIMIT'], true)) crypto_error('Invalid type.', 422, 'invalid_type');
    if ($quantity <= 0) crypto_error('Quantity must be positive.', 422, 'invalid_quantity');
    if ($type === 'LIMIT' && (!$price || $price <= 0)) crypto_error('Limit orders require price.', 422, 'missing_price');
    if (!preg_match('/^[A-Za-z0-9._-]{1,36}$/', $clientOrderId)) crypto_error('Invalid client order id.', 422, 'invalid_client_order_id');

    $params = [
        'symbol' => $symbol,
        'side' => $side,
        'type' => $type,
        'quantity' => $quantity,
        'recvWindow' => $creds['recvWindow'],
        'newClientOrderId' => $clientOrderId
    ];
    if ($type === 'LIMIT') {
        $params['timeInForce'] = 'GTC';
        $params['price'] = $price;
    }

    if ($dryRun) {
        crypto_json(crypto_success([
            'dryRun' => true,
            'request' => [
                'path' => '/api/v3/order',
                'method' => 'POST',
                'params' => $params,
                'useTestnet' => $creds['useTestnet']
            ],
            'status' => 'PREVIEW_READY'
        ], ['meta' => array_merge(source_state('Proxy'), ['source' => 'signed_preview'])]));
    }

    if (!empty($body['simulateUnknown']) || !empty($body['simulateTimeout'])) {
        crypto_error('Execution status unknown. Verify with order-status.', 504, 'execution_status_unknown', [
            'recoverable' => true,
            'clientOrderId' => $clientOrderId
        ]);
    }

    if ($creds['apiKey'] === '' || $creds['apiSecret'] === '') {
        crypto_error('Live execution requires API credentials.', 422, 'missing_credentials', ['recoverable' => true, 'clientOrderId' => $clientOrderId]);
    }

    $live = binance_signed_request('POST', '/api/v3/order', $params, $creds['apiKey'], $creds['apiSecret'], $creds['useTestnet'], true);
    if ($live['ok'] ?? false) {
        crypto_json(crypto_success($live['data'], ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_signed'])]), 200);
    }

    crypto_error('Live order submission failed.', 503, 'order_submit_failed', [
        'recoverable' => true,
        'clientOrderId' => $clientOrderId,
        'details' => $live
    ]);
}

if ($action === 'orders') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $creds = require_private_credentials($body);
    $params = ['recvWindow' => $creds['recvWindow']];
    if (!empty($body['symbol'])) $params['symbol'] = strtoupper((string)$body['symbol']);

    if ($creds['apiKey'] !== '' && $creds['apiSecret'] !== '') {
        $live = binance_signed_request('GET', '/api/v3/openOrders', $params, $creds['apiKey'], $creds['apiSecret'], $creds['useTestnet'], true);
        if ($live['ok'] ?? false) {
            crypto_json(crypto_success($live['data'], ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_signed'])]));
        }
    }

    crypto_json(crypto_success([
        ['orderId'=>101,'symbol'=>'BTCUSDT','side'=>'BUY','status'=>'FILLED'],
        ['orderId'=>102,'symbol'=>'ETHUSDT','side'=>'SELL','status'=>'NEW']
    ], ['meta' => array_merge(source_state('Degraded'), ['source' => 'mock_private'])]));
}

if ($action === 'cancel') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $creds = require_private_credentials($body);
    foreach (['symbol','orderId'] as $field) if (!isset($body[$field]) || $body[$field] === '') crypto_error("Missing field: $field", 422, "missing_$field");
    if ($creds['apiKey'] === '' || $creds['apiSecret'] === '') crypto_error('Live cancel requires API credentials.', 422, 'missing_credentials');

    $live = binance_signed_request('DELETE', '/api/v3/order', [
        'symbol' => strtoupper((string)$body['symbol']),
        'orderId' => (int)$body['orderId'],
        'recvWindow' => $creds['recvWindow']
    ], $creds['apiKey'], $creds['apiSecret'], $creds['useTestnet'], true);

    if ($live['ok'] ?? false) {
        crypto_json(crypto_success($live['data'], ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_signed'])]));
    }

    crypto_error('Cancel failed.', 503, 'cancel_failed', ['details' => $live, 'recoverable' => true]);
}

if ($action === 'order-status') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $creds = require_private_credentials($body);
    if (empty($body['symbol'])) crypto_error('Missing field: symbol', 422, 'missing_symbol');
    if (empty($body['orderId']) && empty($body['origClientOrderId'])) crypto_error('orderId or origClientOrderId required.', 422, 'missing_order_identifier');
    if ($creds['apiKey'] === '' || $creds['apiSecret'] === '') crypto_error('Live status check requires API credentials.', 422, 'missing_credentials');

    $params = [
        'symbol' => strtoupper((string)$body['symbol']),
        'recvWindow' => $creds['recvWindow']
    ];
    if (!empty($body['orderId'])) $params['orderId'] = (int)$body['orderId'];
    if (!empty($body['origClientOrderId'])) $params['origClientOrderId'] = (string)$body['origClientOrderId'];

    $live = binance_signed_request('GET', '/api/v3/order', $params, $creds['apiKey'], $creds['apiSecret'], $creds['useTestnet'], true);
    if ($live['ok'] ?? false) {
        crypto_json(crypto_success($live['data'], ['meta' => array_merge(source_state('Proxy'), ['source' => 'binance_signed'])]));
    }

    crypto_error('Order status check failed.', 503, 'order_status_failed', ['details' => $live, 'recoverable' => true]);
}

if ($action === 'planner-intent') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    foreach (['side','provider','venue'] as $field) if (!isset($body[$field]) || $body[$field] === '') crypto_error("Missing field: $field", 422, "missing_$field");

    $provider = strtolower((string)$body['provider']);
    $venue = strtolower((string)$body['venue']);
    $side = strtoupper((string)$body['side']);

    if (!in_array($provider, ['local','sidecar'], true)) crypto_error('Invalid provider.', 422, 'invalid_provider');
    if (!in_array($venue, ['binance','pancakeswap'], true)) crypto_error('Invalid venue.', 422, 'invalid_venue');
    if (!in_array($side, ['BUY','SELL'], true)) crypto_error('Invalid side.', 422, 'invalid_side');

    if ($provider === 'sidecar') {
        $sidecar = planner_sidecar_call($body);
        if ($sidecar) crypto_json($sidecar);
        crypto_error('Sidecar unavailable.', 503, 'sidecar_unavailable', ['recoverable' => true]);
    }

    if ($venue === 'binance') {
        if (empty($body['symbol'])) crypto_error('Missing field: symbol', 422, 'missing_symbol');
        if ((float)($body['size'] ?? 0) <= 0) crypto_error('Size must be positive.', 422, 'invalid_size');
        $type = strtoupper((string)($body['type'] ?? 'MARKET'));
        if (!in_array($type, ['MARKET','LIMIT'], true)) crypto_error('Invalid type.', 422, 'invalid_type');
        if ($type === 'LIMIT' && empty($body['limitPrice'])) crypto_error('limitPrice required for LIMIT.', 422, 'missing_limit_price');
        crypto_json(crypto_success(binance_local_advisory($body)));
    }

    if (trim((string)($body['tokenIn'] ?? '')) === '' || trim((string)($body['tokenOut'] ?? '')) === '') crypto_error('tokenIn and tokenOut required.', 422, 'missing_token_pair');
    if (trim((string)$body['tokenIn']) === trim((string)$body['tokenOut'])) crypto_error('tokenIn and tokenOut must differ.', 422, 'invalid_token_pair');
    if ((float)($body['amountIn'] ?? 0) <= 0) crypto_error('amountIn must be positive.', 422, 'invalid_amount_in');
    if (!in_array((int)($body['chainId'] ?? 56), [1,56], true)) crypto_error('Unsupported chainId.', 422, 'invalid_chain_id');
    crypto_json(crypto_success(pancakeswap_local_advisory($body)));
}

if ($action === 'sidecar-health') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    $health = planner_sidecar_health();
    if ($health) crypto_json(crypto_success($health, ['meta' => array_merge(source_state('Proxy'), ['source' => 'sidecar_health'])]));
    crypto_error('Sidecar health unavailable.', 503, 'sidecar_health_unavailable', ['recoverable' => true]);
}

if ($action === 'cache-cleanup') {
    if ($method !== 'POST') crypto_error('Method not allowed.', 405, 'method_not_allowed');
    crypto_json(crypto_success(cleanup_market_kline_cache(), ['meta' => array_merge(source_state('Proxy'), ['source' => 'cache_maintenance'])]));
}

crypto_error('Unknown action.', 404, 'unknown_action');
