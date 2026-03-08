# Architecture

Last updated: 2026-03-04

## System Decomposition

### 1) Static Site (root)

- Pages: `index.html`, `about.html`, `projects.html`, `resources.html`, `contact.html`, `Tradejournal.html`, `mom.html`
- Shared assets: `style.css`, `script.js`
- Memorial legacy compatibility:
  - `mem.html` -> redirect to `mom.html`
  - `memory.html` -> redirect to `mom.html`

### 2) Legacy API (`/api/*`)

- Stack: PHP + MySQL
- Entry pattern:
  - `api/db.php` initializes request context, CORS, token auth, and DB connection.
  - Endpoint files implement route-specific logic.
- Endpoints:
  - `campaigns.php` (GET)
  - `simple_earn.php` (GET)
  - `trades.php` (GET/POST; legacy + paginated modes)
  - `health.php` (GET readiness)

### 3) Crypto App (`/crypto/*`)

- Frontend: `crypto/crypto.html`, `crypto/src/css/main.css`, `crypto/src/js/core/app.js`
- Backend: `crypto/backend/api.php`, `crypto/backend/bootstrap.php`, `crypto/backend/health.php`
- Data sources:
  - WebSocket ticker stream from Binance
  - Backend-proxied klines for chart history

## Runtime Flows

### Static page flow

1. Browser requests page.
2. Shared/global scripts and page-local scripts initialize UI.
3. No server-side rendering required.

### Legacy API request flow

1. Request enters endpoint in `api/`.
2. `bootstrap.php` utilities enforce CORS + method + token checks.
3. DB connection from env vars.
4. Endpoint executes SQL and returns JSON envelope.
5. Request-id and request-complete telemetry emitted to logs.

### Crypto chart data flow

1. UI requests chart data via `POST /crypto/backend/api.php?action=klines`.
2. Backend validates symbol/interval/limit and proxies to Binance klines endpoint.
3. Frontend maps klines to OHLC series and updates charts.
4. If proxy fetch fails, frontend uses interval cache/WS-built data fallback.
5. Chart badge state reflects source (`Loading`, `Proxy`, `Fallback`, `Unavailable`).

### Crypto live market flow

1. Frontend opens Binance WebSocket multi-stream.
2. Ticker updates feed price cards, ticker tape, and interval history updates.
3. Trading/account/order actions go through crypto backend and require API credentials.
4. Private trading actions include `recvWindow` timing controls and support `order-status` verification for uncertain execution outcomes.

## Security Model

### Token split

- Legacy API token: `API_TOKEN_LEGACY` (fallback `API_TOKEN`)
- Crypto backend token: `API_TOKEN_CRYPTO` (fallback `API_TOKEN`)

### CORS

- Allowed origins are controlled by `ALLOWED_ORIGINS`.
- CORS preflight returns 204 for `OPTIONS` where configured.

### Request IDs and error conventions

- Both API groups generate/propagate request IDs (`X-Request-Id`).
- Error responses include `request_id`.

## Data and Storage

### MySQL tables

- `trades`
- `campaigns`
- `simple_earn`

Index migration available:

- `api/migrations/2026_03_04_trades_indexes.sql`

### Browser localStorage (crypto app)

Key examples used by frontend:

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

## Documentation Ownership

- Canonical docs: root `docs/*`
- Module entry docs: `api/README.md`, `crypto/README.md`, `crypto/backend/README.md`
- `crypto/docs/*` is treated as supplemental historical/reference content and should not override root canonical contracts.
