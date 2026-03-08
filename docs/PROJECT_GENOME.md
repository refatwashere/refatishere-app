# Project Genome

Last updated: 2026-03-08

This document is the rebuild-grade blueprint for the active RefatIsHere project. It is written so that an engineer or AI agent can reconstruct the full active system from scratch without depending on any other repository document. When existing docs and runtime behavior differ, this document follows code-observed behavior where that difference affects rebuild accuracy.

## 1. Project Identity and Purpose

The repository is a multi-surface personal web property with four active runtime domains:

- a root static website
- a legacy PHP + MySQL API
- a crypto trading web app with a PHP backend
- an optional Vercel-hosted planner sidecar used by the crypto app

The project is not a monolith in one runtime. It is a deployable bundle of static assets, PHP endpoints, MySQL-backed data, browser-local persistence, third-party exchange integrations, and an optional serverless sidecar.

The primary project goal is to serve:

- a public personal website
- a lightweight journal/resource surface
- a crypto market and trading workspace
- a protected legacy data API
- an advisory planner layer that helps with trading decisions without executing them automatically

## 2. System Boundaries

### Active systems

The active rebuild target includes:

- root site files at repository root:
  - `index.html`
  - `about.html`
  - `projects.html`
  - `resources.html`
  - `contact.html`
  - `Tradejournal.html`
  - `mom.html`
  - `mem.html`
  - `memory.html`
  - `style.css`
  - `script.js`
- legacy API under `api/`
- crypto app under `crypto/`
- deploy helpers under `deploy/` and `scripts/`
- canonical docs under `docs/`
- planner sidecar under `vercel-sidecar/`
- static assets under `images/` and `resources/`

### Supporting but non-runtime areas

These support the active system but are not themselves deployed as primary runtime surfaces:

- `docs/reference/`
- `docs/release-history/`
- `DEPLOY_RUNBOOK.md`
- `DEPLOYMENT_STATUS.md`

### Historical and non-canonical areas

These must not be treated as authoritative rebuild targets:

- `archive/`
- `docs/archive/`
- `archive/legacy-sidecar/`

`archive/legacy-sidecar/sidecar/` contains an older alternate sidecar implementation. It is historical only. The only active sidecar implementation is `vercel-sidecar/`.

## 3. Product Surfaces and User-Facing Capabilities

### Root static website

The root site is a static personal website. It does not require server-side rendering. Pages are delivered as static HTML plus shared CSS and JavaScript.

Expected public pages:

- `index.html`: primary landing page
- `about.html`: about/profile page
- `projects.html`: projects showcase
- `resources.html`: downloadable or viewable resource index
- `contact.html`: contact page
- `Tradejournal.html`: standalone journal-oriented page in the root site surface
- `mom.html`: memorial page
- `mem.html`: compatibility redirect to `mom.html`
- `memory.html`: compatibility redirect to `mom.html`

Compatibility requirement for memorial aliases:

- `mem.html` must redirect to `mom.html` by both meta refresh and `window.location.replace`
- `memory.html` must redirect to `mom.html` by both meta refresh and `window.location.replace`
- both redirect pages must still provide a noscript fallback link to `mom.html`

### Legacy API

The legacy API provides protected JSON endpoints for database-backed records:

- campaigns
- simple earn records
- trades journal data
- readiness/health

This API is PHP-based and relies on MySQL. Token auth is mandatory for all protected endpoints.

### Crypto app

The crypto app is a separate frontend served from `crypto/crypto.html`. It combines:

- live Binance market monitoring
- charting with indicator overlays
- local journal and analytics storage
- price alerts
- mock and credential-backed trading workflows
- an advisory planner workspace

### Planner sidecar

The optional planner sidecar is an external Node/Vercel serverless API. It exists to provide advisory planning, especially for PancakeSwap and richer planner behavior, without changing the PHP backend contract. It is not required for the base site or legacy API. It is optional for crypto planner advisory flows because the PHP backend also supports local planner heuristics.

## 4. Runtime Architecture and Hosting Topology

### Topology

The project is composed of these deployable/runtime pieces:

1. Static hosting for root HTML/CSS/JS, `images/`, `resources/`, and the `crypto/` frontend assets.
2. PHP hosting for `api/` and `crypto/backend/`.
3. MySQL database for the legacy API and crypto backend cache tables.
4. Direct browser connection to Binance WebSocket streams for live market data.
5. PHP backend outbound HTTPS to Binance REST for klines, account, order, and order-status flows.
6. Optional PHP backend outbound HTTPS to the Vercel sidecar for planner advisory requests.
7. Optional Vercel sidecar outbound HTTPS to an external PancakeSwap AI adapter endpoint.

### Canonical hosting model

The active documentation assumes a low-cost or free hosting topology:

- static files and PHP endpoints are compatible with InfinityFree-style PHP hosting
- planner sidecar is compatible with Vercel serverless deployment

### Major trust boundaries

- browser to static site: public
- browser to PHP APIs: protected by backend token
- browser to Binance WebSocket: public market stream only
- browser local storage: user-side persistence, not trusted server state
- PHP backend to Binance REST: trusted backend integration using user-supplied Binance credentials for private actions
- PHP backend to Vercel sidecar: trusted service-to-service planner call authenticated with `X-Planner-Token`

## 5. Source Tree and Responsibility Map

### Root

- `*.html`: public website pages
- `style.css`: shared site styling
- `script.js`: shared site behavior
- `README.md`: repository-level operator entrypoint

### `api/`

- `bootstrap.php`: request context, JSON envelopes, CORS, auth, DB connection helpers
- `db.php`: initializes legacy request context and DB connection
- `campaigns.php`: protected GET endpoint for campaign records
- `simple_earn.php`: protected GET endpoint for simple earn records
- `trades.php`: protected GET/POST trades endpoint with compatibility and paginated modes
- `health.php`: unauthenticated readiness check
- `migrations/2026_03_04_trades_indexes.sql`: index migration for trades table

### `crypto/`

- `crypto.html`: crypto app entry page
- `src/css/main.css`: crypto app styling
- `src/js/core/app.js`: crypto app runtime and UI logic
- `backend/bootstrap.php`: crypto backend request helpers
- `backend/api.php`: crypto backend action dispatcher and Binance/planner proxy
- `backend/health.php`: unauthenticated crypto readiness check

### `vercel-sidecar/`

- `api/health.js`: sidecar health endpoint
- `api/planner.js`: sidecar planner endpoint
- `config.js`: chain, venue, and risk constants
- `marketData.js`: market confidence helper logic
- `pancakeswapAiAdapter.js`: optional adapter boundary to external PancakeSwap AI provider
- `vercel.json`: routing config

### `scripts/`

Operator validation and smoke-test helpers, especially:

- `smoke_test.ps1`
- `sidecar_smoke.ps1`
- `pancakeswap_adapter_contract_test.js`

## 6. Frontend Specification

### 6.1 Root site contract

The root site is static and deployable as plain files. It shares:

- `style.css`
- `script.js`

The rebuild target must preserve page-level routing by filename, because hosting assumes file-based static paths.

The root site does not depend on a frontend framework. Rebuilds must not introduce build-step requirements unless they preserve the same deployable file structure.

### 6.2 Crypto app entry and runtime model

The crypto app is served from `crypto/crypto.html` and implemented primarily by:

- `crypto/src/js/core/app.js`
- `crypto/src/css/main.css`
- `crypto/backend/api.php`

The frontend is framework-free browser JavaScript. It owns:

- market watchlist and live prices
- chart rendering and indicator overlays
- local journal data
- price alerts
- mock/futures state
- planner UI state
- backend token and Binance credential entry

### 6.3 Crypto app feature areas

Active functional areas, as reflected in current docs and code:

- Market: symbol list, live prices, search/sort, watchlist filtering
- Charts: price history, candle-like display, EMA 9/21, RSI panel, signal markers
- Journal: local trade entries and analytics
- Alerts: local price alert management
- Trading: mock trading and backend-mediated Binance actions
- Planner workspace: venue-aware advisory planning for Binance and PancakeSwap

### 6.4 Crypto app constants and supported symbols

Current code initializes these default tracked symbols:

- `BTCUSDT`
- `ETHUSDT`
- `BNBUSDT`
- `SOLUSDT`
- `XRPUSDT`
- `ADAUSDT`
- `DOGEUSDT`
- `DOTUSDT`
- `MATICUSDT`
- `AVAXUSDT`
- `LINKUSDT`
- `UNIUSDT`

Current WebSocket endpoint:

- `wss://stream.binance.com:9443/stream`

Current Binance REST base in frontend:

- `https://api.binance.com/api/v3`

Supported chart intervals in current frontend:

- `1m`
- `5m`
- `10m`
- `15m`
- `30m`
- `1h`
- `4h`
- `1d`

### 6.5 Chart system

The chart subsystem must preserve:

- candle-like rendering with wick/body datasets
- EMA 9 overlay
- EMA 21 overlay
- RSI(14) panel
- overbought/oversold zone shading
- bullish and bearish signal markers
- adaptive price bounds with padding
- last-price right-edge tag overlay

Data-source state machine must preserve these visible states:

- `Loading`
- `Proxy`
- `Degraded`
- `Fallback`
- `Unavailable`

Chart history/fallback behavior:

1. Frontend requests `POST /crypto/backend/api.php?action=klines`.
2. Backend validates symbol/interval/limit and proxies to Binance klines.
3. Frontend maps returned klines to OHLC history.
4. If proxy fetch fails, frontend attempts degraded recovery using local interval cache and live WebSocket candle warm-up.
5. For key symbols, backend may return DB-backed cached klines instead of failing.
6. If no usable data is available after retry/degraded windows, chart becomes `Unavailable`.

### 6.6 Local storage contract

Observed and documented browser persistence keys include:

- `cryptoTrades`
- `priceAlerts`
- `watchlist`
- `mockTrades`
- `futuresPositions`
- `appSettings`
- `theme`
- `binance_api_key`
- `binance_api_secret`
- `backend_api_token`
- `use_testnet`
- `binance_recv_window`
- `planner_enabled`
- `planner_provider`
- `planner_venue`
- `planner_chain_id`

These keys are part of the rebuild contract because the current app stores core UX and credentials in localStorage.

### 6.7 Frontend success/error compatibility

The crypto frontend accepts either of these success shapes:

- `status === "success"`
- `success === true`

Error message selection preference:

- `message`
- then `error`

This compatibility logic must be preserved because the legacy API, crypto backend, and sidecar do not all return the same envelope shape.

## 7. Legacy API Specification

### 7.1 Stack and entry behavior

The legacy API uses PHP with MySQL. All protected endpoints include:

1. request ID generation or propagation
2. CORS handling
3. token authentication
4. DB connection setup
5. JSON response output
6. structured error log emission
7. structured request completion log emission on shutdown

Request IDs:

- incoming `X-Request-Id` is accepted if it matches `^[a-zA-Z0-9\-_]{8,64}$`
- otherwise the server generates a random 16-hex-character ID
- response always includes `X-Request-Id`
- error payloads include `request_id`

### 7.2 Authentication

Protected endpoints require header:

- `X-API-Token`

Token resolution:

- primary: `API_TOKEN_LEGACY`
- fallback: `API_TOKEN`

If neither expected token is configured, protected endpoints return `500 Server not configured`.

### 7.3 CORS

Allowed origins come from:

- `ALLOWED_ORIGINS`
- default fallback: `https://refatishere.free.nf`

Only request origins exactly matching the allow-list receive `Access-Control-Allow-Origin`.

Allowed headers:

- `Content-Type`
- `X-API-Token`
- `X-Request-Id`

Protected legacy endpoints support methods:

- `GET`
- `POST`
- `OPTIONS`

Health endpoint supports:

- `GET`
- `OPTIONS`

OPTIONS preflight returns `204`.

### 7.4 Legacy API response envelopes

Standard success envelope:

```json
{ "status": "success", "data": [] }
```

Error envelope:

```json
{ "status": "error", "message": "...", "request_id": "..." }
```

`successResponse()` can also include `meta`.

### 7.5 Endpoints

#### `GET /api/campaigns.php`

- auth required
- returns campaign records sorted by date descending
- response uses standard success envelope

#### `GET /api/simple_earn.php`

- auth required
- returns simple earn records sorted by start date descending
- response uses standard success envelope

#### `GET /api/trades.php`

- auth required
- supports two behavior modes

Mode 1: legacy compatibility mode

- activated when none of `page`, `limit`, `from`, `to`, `sort` are provided
- returns a raw JSON array, not a success envelope
- selects:
  - `id`
  - `pair`
  - `quantity`
  - `entry_price`
  - `exit_price`
  - `fees`
  - `learnings`
  - `created_at` only if that column exists
- ordered by `id DESC`

Mode 2: paginated/enhanced mode

- activated when any of `page`, `limit`, `from`, `to`, or `sort` is present
- response uses success envelope with `meta`

Query rules:

- `page`: integer >= 1, default `1`
- `limit`: integer >= 1, default `25`, capped at `200`
- `from`: `YYYY-MM-DD`
- `to`: `YYYY-MM-DD`
- `sort`:
  - `id_asc`
  - `id_desc`
  - `entry_price_asc`
  - `entry_price_desc`
  - `exit_price_asc`
  - `exit_price_desc`
  - `created_at_asc` only if `created_at` column exists
  - `created_at_desc` only if `created_at` column exists

Validation behavior:

- invalid numeric or date params return `422`
- date filtering without a `created_at` column returns `422`
- invalid sort returns `422` and includes `allowed_sort`

Paginated response meta:

- `page`
- `limit`
- `total`
- `total_pages`
- `has_more`
- `sort`
- `filters.from`
- `filters.to`

#### `POST /api/trades.php`

- auth required
- body must be valid JSON

Required fields:

- `pair`
- `quantity`
- `entryPrice`
- `exitPrice`
- `fees`

Optional field:

- `learnings`

Validation rules documented in current contract:

- `pair` must match `^[A-Z0-9._-]{3,20}(/[A-Z0-9._-]{2,20})?$`
- positive numeric requirements apply to quantity and prices
- `fees` must be non-negative
- large numeric upper bounds are enforced at `<= 100000000`

Status codes:

- `201` on successful insert
- `400` invalid JSON
- `422` validation error
- `500` persistence failure

#### `GET /api/health.php`

- no auth
- checks only environment configuration, not DB query execution
- required env vars:
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASS`
  - `DB_NAME`
  - `API_TOKEN_LEGACY`
- returns `200` when all required values are present
- returns `500` when any are missing

Health payload shape:

```json
{
  "status": "success",
  "data": {
    "service": "legacy-api",
    "ready": true,
    "checked_at": "2026-03-08T00:00:00Z"
  },
  "meta": {
    "missing_count": 0
  }
}
```

### 7.6 Database expectation

The legacy API depends on MySQL connectivity using:

- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`

Connection is created lazily through `getDbConnection()` and fails fast with a `500` JSON error if configuration is incomplete or the connection fails.

## 8. Crypto Backend Specification

### 8.1 Stack and request model

The crypto backend is a PHP JSON API served from:

- `POST /crypto/backend/api.php?action=<action>`

All action requests:

- require method `POST`
- require valid JSON body
- require `X-API-Token`
- generate/propagate request IDs
- emit JSON-only responses

### 8.2 Authentication

Expected token resolution:

- primary: `API_TOKEN_CRYPTO`
- fallback: `API_TOKEN`

If neither is configured, protected crypto actions return `500 Server not configured`.

### 8.3 CORS

Allowed origins come from:

- `ALLOWED_ORIGINS`
- default fallback: `https://refatishere.free.nf`

Allowed methods:

- `POST`
- `OPTIONS`

Health endpoint methods:

- `GET`
- `OPTIONS`

Allowed headers:

- `Content-Type`
- `X-API-Token`
- `X-Request-Id`

### 8.4 Response envelopes

Success envelope:

```json
{ "status": "success", "success": true, "data": {} }
```

Error envelope:

```json
{
  "status": "error",
  "success": false,
  "message": "...",
  "error": "...",
  "request_id": "..."
}
```

### 8.5 Common helper behavior

Common operational behavior in `crypto/backend/bootstrap.php`:

- maps selected Binance upstream codes to operator-friendly messages
- signs Binance requests with HMAC SHA-256
- generates client order IDs in the form `WEB_<SYMBOL>_<TIME>_<RANDOM>` truncated to 36 chars
- retries outbound HTTP requests with bounded attempts and delay
- classifies selected cURL, HTTP, and Binance error codes as “execution status unknown”

Execution-unknown classification currently includes:

- cURL errors `6`, `7`, `28`, `35`, `52`, `56`
- HTTP `502`, `503`, `504`
- Binance codes `-1001`, `-1007`

### 8.6 Supported actions

#### `action=klines`

Purpose:

- fetch chart history for frontend chart rendering

Request:

- method `POST`
- backend token required
- does not require Binance user credentials

Required body:

- `symbol`
- `interval`

Optional body:

- `limit`, default `100`, clamped `20..500`
- `useTestnet` may be present but is ignored for klines

Validation:

- symbol regex `^[A-Z0-9]{5,20}$`
- interval allow-list:
  - `1m`
  - `5m`
  - `10m`
  - `15m`
  - `30m`
  - `1h`
  - `4h`
  - `1d`

Fallback/cache behavior:

- backend maintains a 24-hour DB-backed fallback cache for:
  - `BTCUSDT`
  - `BNBUSDT`
  - `ETHUSDT`
  - `DOGEUSDT`
- if upstream Binance klines fails and cache is valid, backend still returns success envelope with cached klines

Failure diagnostics may include:

- `upstream_code`
- `upstream_errno`
- `source: "binance_klines"`

#### `action=account`

Purpose:

- fetch account data from Binance

Required body:

- `apiKey`
- `apiSecret`
- `useTestnet`

Optional:

- `recvWindow`

`recvWindow` rules:

- default `5000`
- valid range `1..60000`
- non-numeric values return `422`

#### `action=order`

Purpose:

- submit Binance orders through the backend

Required body:

- `apiKey`
- `apiSecret`
- `useTestnet`
- `symbol`
- `side`
- `type`
- `quantity`

Additional requirement:

- `price` required for `LIMIT`

Optional:

- `recvWindow`
- `newClientOrderId`
- `simulateUnknown` for testing uncertain-execution handling

`newClientOrderId` regex:

- `^[A-Za-z0-9._-]{1,36}$`

Unknown-execution contract:

- on selected transport/upstream ambiguity, backend returns an error envelope with:
  - `data.recoverable = true`
  - `data.clientOrderId`
- the client must follow up with `action=order-status`

#### `action=orders`

Purpose:

- list open or recent Binance orders

Required body:

- `apiKey`
- `apiSecret`
- `useTestnet`

Optional:

- `symbol`
- `recvWindow`

#### `action=cancel`

Purpose:

- cancel Binance orders

Required body:

- `apiKey`
- `apiSecret`
- `useTestnet`
- `symbol`
- `orderId`

Optional:

- `recvWindow`

#### `action=order-status`

Purpose:

- resolve uncertain execution or inspect a specific order

Required body:

- `apiKey`
- `apiSecret`
- `useTestnet`
- `symbol`
- one of:
  - `orderId`
  - `origClientOrderId`

Optional:

- `recvWindow`

#### `action=planner-intent`

Purpose:

- return trade planning advice only
- never execute trades

Shared required body:

- `side`: `BUY|SELL`
- `provider`: `local|sidecar`
- `venue`: `binance|pancakeswap`

Binance advisory fields:

- `symbol`
- `size`
- `type`, default `MARKET`
- `limitPrice`
- `marketPrice`
- `mode`, advisory context only, `spot|futures`

PancakeSwap advisory fields:

- `chainId`
- `tokenIn`
- `tokenOut`
- `amountIn`
- `slippageBps`
- `routeType`

Shared planner result contract:

- `data.trade_intent`
- `data.risk_assessment`
- `data.execution_plan`
- `data.meta`

PancakeSwap sidecar path may additionally return:

- `data.meta.adapter`
- `data.meta.adapter_status`
- `data.meta.adapter_failure_reason`
- `data.meta.adapter_failure_message`

Planner behavior:

- `provider=local` uses PHP-local heuristics
- `provider=sidecar` forwards request to `PLANNER_SIDECAR_URL` with `X-Planner-Token`
- planner failure must not execute orders
- planner failure must not block manual order flow in the frontend

### 8.7 Local planner heuristic contract

The local PHP planner contains two distinct heuristic generators:

- Binance local advisory
- PancakeSwap local advisory

Observed local planner characteristics:

- returns `trade_intent`, `risk_assessment`, `execution_plan`, and `meta`
- uses confidence scoring plus heuristic risk flags
- returns `deep_link` pointing to Binance or PancakeSwap
- marks meta source as `local_heuristic`
- planner version observed in local PHP planner: `1.1.0`

### 8.8 Crypto health endpoint

`GET /crypto/backend/health.php`

- no auth
- checks only presence of `API_TOKEN_CRYPTO`
- returns `200` when present
- returns `500` when missing

Payload shape:

```json
{
  "status": "success",
  "success": true,
  "data": {
    "service": "crypto-backend",
    "ready": true,
    "checked_at": "2026-03-08T00:00:00Z"
  },
  "meta": {
    "missing_count": 0
  }
}
```

## 9. Vercel Sidecar Specification

### 9.1 Role

The sidecar is the canonical external planner implementation. It must remain optional from the system perspective and canonical from the planner-provider perspective:

- optional because the crypto backend can still perform local planning
- canonical because current docs and deployment guidance treat it as the preferred external planner path

### 9.2 Stack

- Node.js serverless handlers
- deployed on Vercel
- API-only service
- root `/` intentionally mirrors `/api/health`

### 9.3 Authentication and CORS

Planner auth:

- expected shared secret env var: `PLANNER_SIDECAR_TOKEN`
- compared to header `X-Planner-Token`
- if expected token is configured and request token does not match, return `401`

CORS behavior:

- `Access-Control-Allow-Origin: *`
- planner supports `POST, OPTIONS`
- health supports `GET, OPTIONS`
- allowed headers:
  - `Content-Type`
  - `X-Planner-Token`
  - `X-Request-Id`

### 9.4 Health endpoint

`GET /api/health`

Current response includes:

- `status: 200`
- `data.ready: true`
- `data.version: "2.2-enhanced"`
- `data.features`
- `data.supported_chains`
- `data.supported_venues`
- `data.adapter.pancakeswap_ai_enabled`
- `data.adapter.timeout_ms`

Method mismatch returns `405`.

### 9.5 Planner endpoint

`POST /api/planner`

Request normalization:

- `venue` defaults to `binance` unless explicitly `pancakeswap`
- `provider` defaults to `sidecar`
- `side` normalized to uppercase
- `type` defaults to `MARKET`
- `mode` defaults to `spot`

Binance request normalization:

- `symbol` uppercased
- `size` parsed as number
- `limitPrice` nullable number
- `marketPrice` nullable number

PancakeSwap normalization:

- `chainId` defaults to `CONFIG.venues.pancakeswap.defaultChain`
- `tokenIn` trimmed string
- `tokenOut` trimmed string
- `amountIn` numeric
- `size` mirrors `amountIn`
- `slippageBps` defaults to `CONFIG.defaultSlippage.pancakeswap`
- `routeType` defaults to `auto`
- `symbol` optional

Validation:

- `side` must be `BUY|SELL`
- Binance:
  - `symbol` required
  - `size` must be positive
  - `type` must be `MARKET|LIMIT`
  - `limitPrice` required for `LIMIT`
- PancakeSwap:
  - `tokenIn` required
  - `tokenOut` required
  - token pair must differ
  - `amountIn` must be positive
  - `chainId` must be in configured chain map

Validation failure returns:

- HTTP `422`
- body contains `validation_errors`

Success returns:

- HTTP `200`
- body shape:

```json
{
  "status": 200,
  "data": {
    "trade_intent": {},
    "execution_plan": {},
    "risk_assessment": {},
    "meta": {}
  },
  "request_id": "..."
}
```

### 9.6 Binance advisory generation

The sidecar’s native Binance planner:

- computes confidence using `marketData`
- derives risk flags from request shape
- returns:
  - `trade_intent`
  - `execution_plan`
  - `risk_assessment`
  - `meta`

Observed Binance sidecar meta:

- `source: "sidecar"`
- `adapter: "native-binance"`
- `adapter_status: "native"`
- `provider: "sidecar"`
- `planner_version: "2.1.0"`
- `venue: "binance"`
- `request_id`

### 9.7 PancakeSwap advisory generation

PancakeSwap sidecar path:

1. Try `callPancakeSwapAiAdapter()`.
2. If adapter succeeds, return adapter result.
3. If adapter fails or is disabled, return local fallback advisory with normalized shape.

Local fallback meta includes:

- `source: "sidecar"`
- `adapter: "local-fallback"`
- `adapter_status: "fallback"` when adapter failed
- `adapter_status: "local-only"` when no adapter path is active
- `adapter_failure_reason`
- `adapter_failure_message`
- `provider: "sidecar"`
- `planner_version: "2.1.0"`
- `venue: "pancakeswap"`
- `chain_id`
- `request_id`

### 9.8 Sidecar configuration contract

Configured chains:

- `1`: Ethereum Mainnet
- `56`: BSC Mainnet

Configured PancakeSwap default chain:

- `56`

Configured venue base URLs:

- Binance: `https://www.binance.com/en/trade`
- PancakeSwap: `https://pancakeswap.finance/swap`

Optional adapter environment variables:

- `PANCAKESWAP_AI_API_URL`
- `PANCAKESWAP_AI_API_KEY`
- `PANCAKESWAP_AI_TIMEOUT_MS`

## 10. Data Contracts

### 10.1 MySQL tables

The active project requires at least these domain tables:

- `trades`
- `campaigns`
- `simple_earn`

The crypto backend also depends on a DB-backed kline cache capability for key symbols. The docs mention “Binance Klines Cache” / market-symbol cache behavior. Rebuilds must include a persistence mechanism for cached klines if fidelity to current degraded chart behavior is required.

### 10.2 Legacy API record shape

The live legacy trades endpoint uses fields aligned to current PHP code, not the alternate schema shown in older reference docs:

- `id`
- `pair`
- `quantity`
- `entry_price`
- `exit_price`
- `fees`
- `learnings`
- optional `created_at`

This is a documentation-drift point. Some older reference docs describe a `symbol/status/notes` trade schema. The active runtime contract in `api/trades.php` uses `pair`, `fees`, and `learnings`.

### 10.3 JSON envelope matrix

Legacy API success:

```json
{ "status": "success", "data": [] }
```

Legacy API enhanced success:

```json
{ "status": "success", "data": [], "meta": {} }
```

Legacy API error:

```json
{ "status": "error", "message": "...", "request_id": "..." }
```

Legacy API compatibility mode:

```json
[]
```

Crypto backend success:

```json
{ "status": "success", "success": true, "data": {} }
```

Crypto backend error:

```json
{
  "status": "error",
  "success": false,
  "message": "...",
  "error": "...",
  "request_id": "..."
}
```

Sidecar success:

```json
{ "status": 200, "data": {}, "request_id": "..." }
```

Sidecar error:

```json
{ "status": 401, "message": "Unauthorized", "request_id": "..." }
```

### 10.4 Environment variable matrix

#### Shared / PHP hosting

- `ALLOWED_ORIGINS`: comma-separated exact origin allow-list for both PHP API groups

#### Legacy API required

- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `API_TOKEN_LEGACY`

#### Legacy API fallback

- `API_TOKEN`

#### Crypto backend required

- `API_TOKEN_CRYPTO`

#### Crypto backend fallback

- `API_TOKEN`

#### Crypto backend optional planner proxy

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`

#### Sidecar required for protected planner mode

- `PLANNER_SIDECAR_TOKEN`

#### Sidecar optional PancakeSwap AI adapter

- `PANCAKESWAP_AI_API_URL`
- `PANCAKESWAP_AI_API_KEY`
- `PANCAKESWAP_AI_TIMEOUT_MS`

### 10.5 Environment precedence rules

PHP env resolution order in both `api/bootstrap.php` and `crypto/backend/bootstrap.php`:

1. `getenv()`
2. `$_ENV`
3. `$_SERVER`
4. default value argument

### 10.6 Browser state/storage matrix

| Key | Purpose |
| --- | --- |
| `cryptoTrades` | local trade journal entries |
| `priceAlerts` | alert definitions |
| `watchlist` | preferred symbols |
| `mockTrades` | simulated order/trade state |
| `futuresPositions` | simulated futures state |
| `appSettings` | general UI/app preferences |
| `theme` | theme preference |
| `binance_api_key` | user Binance key |
| `binance_api_secret` | user Binance secret |
| `backend_api_token` | crypto backend token |
| `use_testnet` | Binance testnet toggle |
| `binance_recv_window` | private action recvWindow |
| `planner_enabled` | planner feature flag |
| `planner_provider` | planner provider selection |
| `planner_venue` | planner venue selection |
| `planner_chain_id` | selected DEX chain |

## 11. Runtime Flows

### 11.1 Static page flow

1. Browser requests a root HTML page.
2. Shared CSS and JavaScript load.
3. Page-specific DOM behavior initializes.
4. No SSR or API requirement is needed for basic page rendering.

### 11.2 Legacy API flow

1. Request enters endpoint in `api/`.
2. Request context and request ID are initialized.
3. CORS and preflight are handled.
4. API token is validated.
5. DB connection is created.
6. Route-specific SQL executes.
7. JSON response is returned.
8. Request completion telemetry is written via shutdown hook.

### 11.3 Crypto live market flow

1. Frontend opens Binance multi-stream WebSocket.
2. Ticker events update market cards, ticker tape, and interval-history state.
3. UI updates prices using symbol-specific decimal precision.

### 11.4 Crypto chart flow

1. Frontend requests `action=klines`.
2. Backend validates payload.
3. Backend calls Binance klines endpoint.
4. Frontend maps results to chart datasets.
5. On upstream failure, backend may serve DB cache for key symbols.
6. Frontend may use local fallback/degraded recovery from interval cache and live ticks.
7. Badge state reflects actual source health.

### 11.5 Private trading flow

1. User enters Binance credentials and backend token in frontend settings/state.
2. Frontend sends signed-action request intent to PHP backend.
3. Backend validates token and request shape.
4. Backend signs Binance REST request with HMAC SHA-256.
5. Backend returns exchange response or normalized error.
6. If execution status is uncertain, frontend must inspect `data.recoverable` and continue with `order-status`.

### 11.6 Planner advisory flow

1. User enables planner advisories with `planner_enabled`.
2. User selects venue and provider.
3. Frontend posts planner payload to `action=planner-intent`.
4. PHP backend validates and normalizes request.
5. If `provider=local`, PHP returns heuristic advisory.
6. If `provider=sidecar`, PHP forwards payload to `PLANNER_SIDECAR_URL` with `X-Planner-Token`.
7. Sidecar either returns native Binance advisory, adapter-backed PancakeSwap advisory, or local PancakeSwap fallback.
8. Frontend renders planner results.
9. Manual order flow remains separate and explicit.

### 11.7 Degraded and fallback flows

#### Chart data degradation

- backend fallback cache may serve key symbols
- frontend degraded window allows WebSocket candle warm-up
- final state can become `Fallback` or `Unavailable`

#### Order uncertainty

- backend may return recoverable error envelope
- client must verify via `order-status`

#### Planner degradation

- sidecar unavailable: backend should fail planner request in a controlled way
- frontend must continue to allow manual trading
- adapter unavailable: sidecar returns normalized local fallback advisory instead of breaking the contract

## 12. Security and Trust Boundaries

### 12.1 Token split

There are distinct backend tokens for active PHP API groups:

- `API_TOKEN_LEGACY` for `api/`
- `API_TOKEN_CRYPTO` for `crypto/backend/`

Both may fall back to `API_TOKEN`, but the split is intentional and must be preserved.

### 12.2 CORS model

PHP APIs do not blindly allow all origins. They allow only exact matches from `ALLOWED_ORIGINS`. Sidecar CORS is permissive with `*`.

### 12.3 Credential handling

Binance API key and secret are stored in browser localStorage in the current implementation. This is not ideal security architecture, but it is part of the current rebuild target and must be documented as such.

The backend API token is also stored in localStorage.

### 12.4 Advisory-only planner boundary

Planner functionality must remain advisory only:

- it never auto-submits orders
- it never mutates exchange state directly
- it must not block manual trading if planner logic fails

### 12.5 Request tracing and logging

Both PHP API groups emit:

- `X-Request-Id`
- request-complete shutdown logs
- structured error events

This tracing model is part of the operational rebuild target.

## 13. Deployment Blueprint

### 13.1 Minimum deployable topology

A minimum production-equivalent rebuild must provide:

1. static hosting for root pages, `crypto/`, `images/`, and `resources/`
2. PHP runtime for `api/` and `crypto/backend/`
3. MySQL for legacy API tables and crypto cache support
4. configured environment variables for tokens and DB access

Optional but supported:

5. Vercel deployment for `vercel-sidecar/`

### 13.2 InfinityFree/PHP hosting assumptions

Current docs assume InfinityFree compatibility constraints:

- PHP backend remains the primary runtime
- static and PHP files are deployed together
- environment values may be provided through hosting config and `.htaccess` `SetEnv`
- full crypto behavior requires PHP and outbound network access

### 13.3 Sidecar deployment

Canonical planner sidecar URL pattern:

- `https://<project>.vercel.app/api/planner`

Canonical health URLs:

- `https://<project>.vercel.app/`
- `https://<project>.vercel.app/api/health`

PHP backend sidecar configuration:

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`

### 13.4 Health and readiness checks

Required operator-visible readiness endpoints:

- `GET /api/health.php`
- `GET /crypto/backend/health.php`
- `GET /api/health` on sidecar

### 13.5 Smoke-test contract

The main smoke script currently expects:

- base deployed URL
- legacy token
- crypto token
- allowed origin
- optional sidecar URL
- optional sidecar token

Representative invocation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1 `
  -BaseUrl "https://your-domain.example" `
  -LegacyToken "<API_TOKEN_LEGACY>" `
  -CryptoToken "<API_TOKEN_CRYPTO>" `
  -AllowedOrigin "https://your-domain.example" `
  -SidecarUrl "https://your-project.vercel.app" `
  -SidecarToken "<PLANNER_SIDECAR_TOKEN>"
```

Smoke coverage includes:

- unauthorized behavior
- malformed payload rejection
- CORS checks
- recvWindow validation
- unknown-execution recovery envelope
- planner validation
- optional sidecar auth and planner shape checks

## 14. Rebuild Checklist

### Mandatory for fidelity

- preserve root static page filenames
- preserve `mem.html` and `memory.html` redirect compatibility
- preserve `api/` token-authenticated PHP endpoints
- preserve `GET /api/trades.php` raw-array compatibility mode
- preserve crypto backend action dispatch pattern
- preserve crypto backend token split from legacy API token
- preserve crypto frontend localStorage contract
- preserve planner advisory-only boundary
- preserve sidecar as the canonical external planner path
- preserve request ID propagation and JSON error tracing

### Acceptable simplifications only if compatibility is preserved

- internal code organization may change
- UI implementation details may change
- database schema may be normalized differently internally
- chart rendering library details may change
- sidecar internal helper decomposition may change

These simplifications are acceptable only if all externally visible routes, behaviors, payload shapes, storage keys, and fallback semantics remain compatible.

### Do not change without intentional contract migration

- endpoint paths
- token header names
- planner payload vocabulary
- planner advisory-only semantics
- root page filenames
- health endpoint semantics
- legacy trades raw-array response behavior

## 15. Appendices

### A. Endpoint Matrix

| Surface | Path | Method | Auth | Notes |
| --- | --- | --- | --- | --- |
| Legacy API | `/api/campaigns.php` | `GET` | `X-API-Token` | campaigns list |
| Legacy API | `/api/simple_earn.php` | `GET` | `X-API-Token` | simple earn list |
| Legacy API | `/api/trades.php` | `GET` | `X-API-Token` | raw-array or paginated mode |
| Legacy API | `/api/trades.php` | `POST` | `X-API-Token` | insert trade |
| Legacy API | `/api/health.php` | `GET` | none | env readiness |
| Crypto backend | `/crypto/backend/api.php?action=klines` | `POST` | `X-API-Token` | chart history |
| Crypto backend | `/crypto/backend/api.php?action=account` | `POST` | `X-API-Token` | Binance account |
| Crypto backend | `/crypto/backend/api.php?action=order` | `POST` | `X-API-Token` | submit order |
| Crypto backend | `/crypto/backend/api.php?action=orders` | `POST` | `X-API-Token` | list orders |
| Crypto backend | `/crypto/backend/api.php?action=cancel` | `POST` | `X-API-Token` | cancel order |
| Crypto backend | `/crypto/backend/api.php?action=order-status` | `POST` | `X-API-Token` | verify status |
| Crypto backend | `/crypto/backend/api.php?action=planner-intent` | `POST` | `X-API-Token` | advisory only |
| Crypto backend | `/crypto/backend/health.php` | `GET` | none | env readiness |
| Sidecar | `/api/health` | `GET` | none | service health |
| Sidecar | `/api/planner` | `POST` | `X-Planner-Token` when configured | advisory only |

### B. Environment Matrix

| Variable | Required By | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | both PHP API groups | exact CORS allow-list |
| `DB_HOST` | legacy API | MySQL host |
| `DB_USER` | legacy API | MySQL user |
| `DB_PASS` | legacy API | MySQL password |
| `DB_NAME` | legacy API | MySQL database |
| `API_TOKEN_LEGACY` | legacy API | primary auth token |
| `API_TOKEN_CRYPTO` | crypto backend | primary auth token |
| `API_TOKEN` | both PHP API groups | fallback auth token |
| `PLANNER_SIDECAR_URL` | crypto backend | external planner URL |
| `PLANNER_SIDECAR_TOKEN` | crypto backend, sidecar | planner shared secret |
| `PANCAKESWAP_AI_API_URL` | sidecar | optional adapter endpoint |
| `PANCAKESWAP_AI_API_KEY` | sidecar | optional adapter key |
| `PANCAKESWAP_AI_TIMEOUT_MS` | sidecar | optional adapter timeout |

### C. Error and Fallback Matrix

| Area | Condition | Behavior |
| --- | --- | --- |
| Legacy API | bad or missing token | `401` with `request_id` |
| Legacy API | missing config | `500` JSON error |
| Legacy API trades | bad query params | `422` |
| Crypto backend | bad or missing token | `401` with `request_id` |
| Crypto backend | invalid JSON | `400` |
| Crypto backend | invalid recvWindow | `422` |
| Crypto order | execution uncertain | recoverable error envelope with `clientOrderId` |
| Crypto klines | upstream unavailable, cache valid | success from cache |
| Crypto charts | proxy unavailable but local history available | degraded/fallback chart state |
| Planner sidecar | bad planner token | `401` |
| Planner sidecar | invalid planner payload | `422` with `validation_errors` |
| PancakeSwap adapter | adapter unavailable | sidecar local fallback with adapter provenance |

### D. Drift Notes That Matter for Rebuild

- The active legacy trades runtime uses `pair`, `fees`, and `learnings`. Older reference docs describe a different `trades` schema. Rebuilds targeting runtime fidelity must follow the active endpoint behavior.
- The sidecar health version in current runtime is `2.2-enhanced`. Older docs may still mention `2.0-enhanced`.
- The crypto planner local PHP implementation and the sidecar planner use different internal planner versions and envelope styles, but the frontend compatibility layer intentionally tolerates this.

## Final Rebuild Rule

If a from-scratch implementation preserves:

- all current public paths
- all current token headers
- the legacy trades compatibility mode
- the crypto backend action contract
- the localStorage key contract
- the planner advisory-only boundary
- the optional sidecar planner path
- the current health, fallback, and tracing semantics

then it is functionally equivalent to the active project even if internal code organization differs.
