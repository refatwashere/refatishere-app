# API Reference

Last updated: 2026-03-07

All protected endpoints require `X-API-Token`.

## Response Envelopes

### Legacy API (`/api/*`)

Success (standard):

```json
{ "status": "success", "data": [] }
```

Error:

```json
{ "status": "error", "message": "...", "request_id": "..." }
```

Compatibility behavior:

- `GET /api/trades.php` without query enhancement params returns a raw array (legacy compatibility).

### Crypto backend (`/crypto/backend/*`)

Success:

```json
{ "status": "success", "success": true, "data": {} }
```

Error:

```json
{ "status": "error", "success": false, "message": "...", "error": "...", "request_id": "..." }
```

---

## Legacy API Endpoints

## `GET /api/campaigns.php`

- Auth: required (`API_TOKEN_LEGACY`)
- Returns campaign records sorted by date descending.
- Status: `200`, `401`, `500`

## `GET /api/simple_earn.php`

- Auth: required (`API_TOKEN_LEGACY`)
- Returns simple earn rows sorted by start date descending.
- Status: `200`, `401`, `500`

## `GET /api/trades.php`

- Auth: required (`API_TOKEN_LEGACY`)
- Two modes:
  - Legacy mode (no query enhancement params): raw array
  - Paginated mode (if any of `page|limit|from|to|sort` is provided): success envelope with `meta`

Query params:

- `page` integer >= 1, default `1`
- `limit` integer >= 1, max `200`, default `25`
- `from` date `YYYY-MM-DD` (requires `created_at` column)
- `to` date `YYYY-MM-DD` (requires `created_at` column)
- `sort` one of:
  - `id_asc`, `id_desc`
  - `entry_price_asc`, `entry_price_desc`
  - `exit_price_asc`, `exit_price_desc`
  - `created_at_asc`, `created_at_desc` (if `created_at` exists)

Paginated success includes:

- `meta.page`
- `meta.limit`
- `meta.total`
- `meta.total_pages`
- `meta.has_more`
- `meta.sort`
- `meta.filters.from|to`

Validation/status codes:

- `422` invalid params/date format/sort
- `500` query/prepare/exec failures

## `POST /api/trades.php`

- Auth: required (`API_TOKEN_LEGACY`)
- JSON payload:
  - `pair` (required)
  - `quantity` (required > 0)
  - `entryPrice` (required > 0)
  - `exitPrice` (required > 0)
  - `fees` (required >= 0)
  - `learnings` (optional string)

Validation rules:

- Pair regex: `^[A-Z0-9._-]{3,20}(/[A-Z0-9._-]{2,20})?$`
- Numeric upper bounds enforced (<= 100000000)

Status codes:

- `201` on insert
- `400` invalid JSON
- `422` validation failure
- `500` persistence failure

## `GET /api/health.php`

- Auth: none
- Checks env vars: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `API_TOKEN_LEGACY`
- Returns:
  - `200` with `data.ready=true`
  - `500` with `data.ready=false`

---

## Crypto Backend Endpoints

Base path: `/crypto/backend/api.php`

All actions:

- Method: `POST`
- Auth: required (`API_TOKEN_CRYPTO`)
- Body: JSON

## `POST /crypto/backend/api.php?action=klines`

- Requires: `symbol`, `interval`
- Optional: `limit` (default `100`, clamped `20..500`)
- `useTestnet` ignored for klines (always main Binance market endpoint)
- DB-backed 24h backup cache is enabled for:
  - `BTCUSDT`
  - `BNBUSDT`
  - `ETHUSDT`
  - `DOGEUSDT`
  (served when upstream klines is unavailable)

Validation:

- Symbol regex: `^[A-Z0-9]{5,20}$`
- Interval allow-list: `1m`, `5m`, `10m`, `15m`, `30m`, `1h`, `4h`, `1d`

Status codes:

- `200` success with kline array
- `422` invalid symbol/interval
- `401` unauthorized
- `4xx/5xx` mapped upstream failure

Upstream failure diagnostics (non-breaking optional fields):

- `upstream_code`
- `upstream_errno`
- `source` (`binance_klines`)

If cache fallback is served, response still uses success envelope with cached klines array.

## `POST /crypto/backend/api.php?action=account`

Requires `apiKey`, `apiSecret`, `useTestnet`.

Optional:

- `recvWindow` (`1..60000`, default `5000`)

## `POST /crypto/backend/api.php?action=order`

Requires:

- `apiKey`, `apiSecret`, `useTestnet`
- `symbol`, `side`, `type`, `quantity`
- For LIMIT: `price`

Optional:

- `recvWindow` (`1..60000`, default `5000`)
- `newClientOrderId` (regex `^[A-Za-z0-9._-]{1,36}$`; server auto-generates if omitted)

Unknown execution contract:

- If upstream timeout/transport ambiguity occurs, backend returns error envelope with:
  - `data.recoverable = true`
  - `data.clientOrderId`
  - message instructing `order-status` verification.

## `POST /crypto/backend/api.php?action=orders`

Requires `apiKey`, `apiSecret`, `useTestnet`; optional `symbol`.

Optional:

- `recvWindow` (`1..60000`, default `5000`)

## `POST /crypto/backend/api.php?action=cancel`

Requires `apiKey`, `apiSecret`, `useTestnet`, `symbol`, `orderId`.

Optional:

- `recvWindow` (`1..60000`, default `5000`)

## `POST /crypto/backend/api.php?action=order-status`

Requires:

- `apiKey`, `apiSecret`, `useTestnet`, `symbol`
- one of: `orderId` or `origClientOrderId`

Optional:

- `recvWindow` (`1..60000`, default `5000`)

## `POST /crypto/backend/api.php?action=planner-intent`

Planner advisory endpoint. Does not execute trades.

Requires:

- `side` (`BUY|SELL`)
- `provider` (`local|sidecar`)
- `venue` (`binance|pancakeswap`)

Optional:

- Binance fields:
  - `symbol` (regex `^[A-Z0-9]{5,20}$`)
  - `size` (numeric, `> 0`, `<= 100000000`)
  - `type` (`MARKET|LIMIT`, default `MARKET`)
  - `limitPrice` (numeric)
  - `marketPrice` (numeric)
  - `mode` (`spot|futures`, advisory context only)
- PancakeSwap fields:
  - `chainId`
  - `tokenIn`
  - `tokenOut`
  - `amountIn`
  - `slippageBps`
  - `routeType`

Success payload contracts:

- `data.trade_intent`
- `data.risk_assessment`
- `data.execution_plan`
- `data.meta`
- `data.meta.adapter` / `data.meta.adapter_status` on PancakeSwap sidecar flows

Status codes:

- `200` advisory result returned
- `401` unauthorized
- `422` validation error
- `502/503` sidecar unavailable (when `provider=sidecar`)

## `GET /crypto/backend/health.php`

- Auth: none
- Checks env var: `API_TOKEN_CRYPTO`
- Returns readiness envelope with `data.ready`.

---

## Error and Observability Notes

- Both API groups include `request_id` for error diagnostics.
- CORS preflight uses `OPTIONS` and expected 204 behavior.
- Structured request-complete logs include status and duration.
