# AI Planner Architecture

Last updated: 2026-03-07

This document defines a venue-aware planner layer for the crypto app without changing existing trade execution contracts.

## Goals

- Keep current Binance REST/WebSocket trading workflow unchanged by default.
- Add optional advisory planning (`planner_enabled`) before order execution.
- Add PancakeSwap as a first-class advisory venue inside the current trading workspace.
- Preserve InfinityFree compatibility (PHP backend remains primary runtime).
- Keep Vercel sidecar as the canonical external planner path while retaining local fallback support.

## Runtime Model

- Canonical runtime: frontend (`crypto/src/js/core/app.js`) + PHP backend (`crypto/backend/api.php`).
- Planner action endpoint: `POST /crypto/backend/api.php?action=planner-intent`.
- Auth: same backend token model (`X-API-Token`).
- Feature flag: `planner_enabled` in browser local storage.
- External planner auth: PHP forwards `PLANNER_SIDECAR_TOKEN` to Vercel as `X-Planner-Token`.

## Planner Contracts

## `TradeIntent`

```json
{
  "venue": "binance",
  "symbol": "BTCUSDT",
  "side": "BUY",
  "size": 0.01,
  "confidence": 0.62,
  "rationale": "Entry intent is long-biased.",
  "risk_flags": ["market_order_slippage"]
}
```

## `RiskAssessment`

```json
{
  "score": 38,
  "level": "medium",
  "flags": ["market_order_slippage"]
}
```

## `ExecutionPlan`

```json
{
  "mode": "assisted",
  "steps": [
    { "step": 1, "description": "Review symbol, side, and size against your strategy." }
  ],
  "deep_link": "https://www.binance.com/en/trade/BTC_USDT?type=spot"
}
```

## Data Flow

1. User opens the trading-tab planner workspace or submits a Binance order.
2. Frontend checks `planner_enabled`.
3. If enabled, frontend calls `action=planner-intent` with normalized `provider + venue + venue-specific fields`.
4. PHP validates and normalizes the request.
5. If `provider=sidecar`, PHP forwards the payload to `PLANNER_SIDECAR_URL` with `X-Planner-Token`.
6. Vercel dispatches to a venue engine:
   - native Binance advisory
   - PancakeSwap AI adapter
   - PancakeSwap local fallback
7. Frontend renders `trade_intent`, `execution_plan`, and `risk_assessment` in the planner results panel.
8. Binance order submission can continue through the existing `action=order` flow.

If a planner advisory call fails, frontend shows a warning and continues manual flow. PancakeSwap remains advisory-only in this phase.
If the PancakeSwap adapter fails, the sidecar falls back deterministically and annotates `data.meta.adapter_status` plus failure provenance.

## Provider Strategy

- `provider=sidecar` (canonical): proxy to `PLANNER_SIDECAR_URL`.
- `provider=local` (fallback): backend heuristic planner.

If sidecar is unavailable, backend returns controlled error and order flow can continue manually.

## Safety Boundaries

- Planner is advisory only, never auto-submits trades.
- Existing order API remains source of truth for execution.
- Planner failures do not block normal manual trade behavior.
- PancakeSwap AI is isolated behind a sidecar adapter boundary and does not change frontend or PHP contracts.

## Environment

- Optional: `PLANNER_SIDECAR_URL` for external planner proxy.
- Optional: `PLANNER_SIDECAR_TOKEN` for sidecar authentication.
- Optional: `PANCAKESWAP_AI_API_URL`, `PANCAKESWAP_AI_API_KEY`, `PANCAKESWAP_AI_TIMEOUT_MS` for sidecar adapter use.
- Required unchanged: `API_TOKEN_CRYPTO`, `ALLOWED_ORIGINS`.

## Validation Rules

- Shared:
  - `venue`: `binance|pancakeswap`
  - `side`: `BUY|SELL`
  - `provider`: `local|sidecar`
- Binance:
  - `symbol`: `^[A-Z0-9]{5,20}$`
  - `size`: numeric, `> 0`, `<= 100000000`
  - `type`: `MARKET|LIMIT`
- PancakeSwap:
  - `tokenIn` and `tokenOut` required and must differ
  - `amountIn`: numeric, `> 0`
  - `chainId`: supported chain
  - `slippageBps`: optional positive numeric value

## Testing

Smoke coverage should include:

- Unauthorized `planner-intent` handling (401 via token model)
- Invalid payload (422 + `request_id`)
- Valid Binance payload (200 + normalized advisory envelope)
- Valid PancakeSwap payload (200 + normalized advisory envelope)
- Sidecar adapter failure falls back without breaking response shape
- Planner failure path does not block order placement
