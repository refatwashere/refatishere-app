# Crypto App

Last updated: 2026-03-07

## Scope

The crypto app is served from `crypto/crypto.html` and implemented with:

- `crypto/src/js/core/app.js`
- `crypto/src/css/main.css`
- `crypto/backend/api.php` (proxy/backend actions)

## Tabs and Functional Areas

- Market: live prices, search, sort, watchlist filter
- Charts: candle-like chart + indicators + RSI panel
- Journal: local trade entries and analytics
- Alerts: local price alert list
- Trading: mock and API-backed order/account flows
- Planner workspace: venue-aware planner advisory flow for Binance and PancakeSwap

## Market Data Model

### Live ticker

- Binance WebSocket multi-stream ticker updates for tracked symbols.
- UI updates:
  - market cards
  - scrolling ticker
  - current interval history updates

### Price precision

- Live prices are formatted with Binance-style per-symbol decimals (with fallback logic).

## Chart System

## Chart composition

- Price panel:
  - candle-like rendering using wick/body datasets
  - EMA 9 and EMA 21 overlays
  - bullish/bearish signal markers
- RSI panel:
  - RSI(14) line
  - 30/70 guides
  - overbought/oversold zone shading

## Readability enhancements

- adaptive y-range with dynamic padding
- right-side price axis formatting
- right-edge last price tag overlay

## Signal logic (conservative)

- Bullish marker when EMA9 crosses above EMA21 and RSI in 50-70.
- Bearish marker when EMA9 crosses below EMA21 and RSI in 30-50.

## Chart data source reliability

Primary source:

- `POST /crypto/backend/api.php?action=klines`

Fallback source:

- local `intervalData` cache/WS-built candles if proxy fetch fails.
- backend DB cache (24-hour TTL) for `BTCUSDT`, `BNBUSDT`, `ETHUSDT`, `DOGEUSDT` when Binance klines is unavailable.

Resilience controls:

- fetch timeout
- interval change debounce
- stale-response nonce guard
- staged degraded recovery before terminal unavailable
- crypto backend klines persistence/refresh in DB with 24-hour expiry for key symbols

## Data source badge states

- `Loading`: fetch in progress
- `Proxy`: backend `klines` success
- `Degraded`: proxy fetch failed, waiting briefly for live candle warm-up
- `Fallback`: proxy failed, local fallback used
- `Unavailable`: no historical or live candle data after retry window

## Trading/API Boundaries

Actions requiring Binance credentials:

- `account`, `order`, `orders`, `cancel`, `order-status`

Action not requiring Binance credentials:

- `klines`
- `planner-intent` (advisory only; no trade execution)

All backend actions still require backend token (`X-API-Token`).

Timing security controls:

- private actions include `timestamp` + configurable `recvWindow` (default `5000`)
- `recvWindow` is validated/clamped on backend (`1..60000`)

Order reliability flow:

- `order` supports `newClientOrderId` (auto-generated if omitted)
- uncertain upstream execution returns recoverable envelope with `clientOrderId`
- frontend follows with `order-status` verification for deterministic recovery.

Klines troubleshooting behavior:

- `klines` upstream failures may include `upstream_code`, `upstream_errno`, and `source=binance_klines`.
- chart enters `Degraded` before `Unavailable` to allow live candle warm-up.

Integration boundary note:

- App uses Binance REST/WebSocket HMAC credentials.
- Binance FIX API (Ed25519) is not part of this runtime deployment.

## Planner advisory layer

- Frontend feature flag: `planner_enabled` (default off)
- Trading tab also exposes a dedicated planner workspace with:
  - `planner_venue`
  - `planner_provider`
  - Binance and PancakeSwap venue-specific inputs
- When enabled, planner calls use:
  - `POST /crypto/backend/api.php?action=planner-intent`
- Planner output is advisory only:
  - confidence
  - rationale
  - risk flags
  - assisted execution steps/deep-link
- PancakeSwap path can return sidecar adapter provenance in `data.meta.adapter`
- If planner call fails, UI shows warning and continues normal manual order flow.

## Local Storage Keys

Examples used by app:

- `cryptoTrades`, `priceAlerts`, `watchlist`
- `mockTrades`, `futuresPositions`
- `appSettings`, `theme`
- `binance_api_key`, `binance_api_secret`
- `backend_api_token`, `use_testnet`
- `binance_recv_window`
- `planner_enabled`
- `planner_provider`, `planner_venue`, `planner_chain_id`

## Error Handling and Compatibility

- Frontend success detection accepts both:
  - `status === "success"`
  - `success === true`
- Error message preference:
  - `message`, then `error`

## Accessibility and Motion

- Tab keyboard navigation and ARIA state updates
- Modal focus capture/return and escape-to-close
- Reduced-motion handling for animated UI elements
