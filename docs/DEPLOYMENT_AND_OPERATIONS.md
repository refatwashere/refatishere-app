# Deployment and Operations

Last updated: 2026-03-07

This document is the canonical deployment and operations reference. `DEPLOY_RUNBOOK.md` remains a concise operational quick runbook.

For historical provider-selection strategy under free/no-card constraints, see `docs/archive/DEPLOYMENT_OPTIONS_FREE.md`.

## Environment Variables

## Legacy API (`/api/*`)

Required:

- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `API_TOKEN_LEGACY`

Compatibility fallback:

- `API_TOKEN` (temporary only)

Optional:

- `PLANNER_SIDECAR_URL` (used only when planner requests `provider=sidecar`)
- `PLANNER_SIDECAR_TOKEN` (shared secret forwarded by PHP as `X-Planner-Token`)
- `PANCAKESWAP_AI_API_URL` (optional sidecar adapter endpoint)
- `PANCAKESWAP_AI_API_KEY` (optional sidecar adapter credential)
- `PANCAKESWAP_AI_TIMEOUT_MS` (optional sidecar adapter timeout)

## Crypto backend (`/crypto/backend/*`)

Required:

- `API_TOKEN_CRYPTO`

Compatibility fallback:

- `API_TOKEN` (temporary only)

## Shared

- `ALLOWED_ORIGINS` (comma-separated trusted origins)

## Deployment Sequence

1. Create timestamped backup of deployed files.
2. Export current environment values.
3. Apply/verify env vars for both API groups.
4. Deploy files/directories:
   - root HTML/CSS/JS
   - `api/`
   - `crypto/`
   - `resources/`
   - `images/`
5. Optional DB migration:
   - `api/migrations/2026_03_04_trades_indexes.sql`
6. Run smoke tests and enforce pass/fail gates.
7. If failed, rollback immediately.

Planner rollout sequence:

1. Deploy `vercel-sidecar/`.
2. Verify `GET /` and `GET /api/health`.
3. Verify direct `POST /api/planner` for Binance and PancakeSwap.
4. Wire or update InfinityFree `PLANNER_SIDECAR_URL` / `PLANNER_SIDECAR_TOKEN`.
5. Run backend proxy and frontend planner smoke tests.

## Runtime Client Configuration (crypto page)

In `crypto/crypto.html` settings:

- Set `Backend API Token` = `API_TOKEN_CRYPTO`
- Configure Binance REST API key/secret if using account/order actions
- Keep testnet enabled for safe validation
- Set `recvWindow` (default `5000`)
- Set `Enable Planner Advisories (Beta)` to unlock live planner requests
- Use the trading-tab planner workspace for venue-aware planner advisory requests:
  - Binance uses symbol / side / size / order type inputs
  - PancakeSwap uses chain / token pair / amount / slippage / route inputs
- FIX API (Ed25519) is not used by this deployment path

## Smoke Test Commands

Baseline:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1 `
  -BaseUrl "https://your-domain.example" `
  -LegacyToken "<API_TOKEN_LEGACY>" `
  -CryptoToken "<API_TOKEN_CRYPTO>" `
  -AllowedOrigin "https://your-domain.example" `
  -SidecarUrl "https://your-project.vercel.app" `
  -SidecarToken "<PLANNER_SIDECAR_TOKEN>"
```

Full trading-flow validation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1 `
  -BaseUrl "https://your-domain.example" `
  -LegacyToken "<API_TOKEN_LEGACY>" `
  -CryptoToken "<API_TOKEN_CRYPTO>" `
  -AllowedOrigin "https://your-domain.example" `
  -SidecarUrl "https://your-project.vercel.app" `
  -SidecarToken "<PLANNER_SIDECAR_TOKEN>" `
  -RunTradingFlow `
  -BinanceApiKey "<BINANCE_TESTNET_KEY>" `
  -BinanceApiSecret "<BINANCE_TESTNET_SECRET>"
```

Adapter contract validation:

```bash
node scripts/pancakeswap_adapter_contract_test.js
```

## Smoke Coverage (current)

- Negative auth checks (legacy + crypto)
- Validation failures and request-id checks
- CORS allow/deny behavior
- Trades pagination/meta response
- Crypto `klines` positive and negative checks
- Crypto private-action `recvWindow` validation checks
- Crypto `order-status` checks
- Crypto `planner-intent` validation and success checks
- Direct Vercel sidecar health and advisory checks when sidecar params are supplied
- Crypto chart state labels include `Loading`, `Proxy`, `Degraded`, `Fallback`, `Unavailable`
- Readiness endpoint checks
- Frontend critical page and resource checks
- Crypto UI regression markers

Adapter decision table:

| State | Expected behavior | Release meaning |
|---|---|---|
| Adapter disabled | PancakeSwap uses local fallback | Acceptable |
| Adapter enabled and healthy | Sidecar returns adapter-backed planner advisories | Preferred |
| Adapter enabled but unhealthy | Sidecar falls back with adapter failure provenance | Investigate before promoting broadly |

## Manual QA Matrix (release gate companion)

- Desktop and mobile page rendering (`360px`, `768px`, `1024px+`)
- Keyboard-only navigation through root nav, tabs, and modal controls
- Crypto settings save/clear verification (`backend token`, `use testnet`, `recvWindow`)
- Crypto order flows:
  - success path
  - failure path
  - unknown/recoverable path with `order-status` follow-up
- Crypto chart source behavior:
  - `Degraded` appears before terminal `Unavailable` when waiting for live candle warm-up
- Memorial route behavior:
  - `mem.html` redirects to `mom.html`
  - `memory.html` redirects to `mom.html`

## Pass/Fail Gates

Mark deployment PASS only when all are true:

1. Smoke script exits successfully.
2. `/api/health.php` and `/crypto/backend/health.php` return ready.
3. Vercel `/` and `/api/health` return ready with adapter metadata.
4. Direct sidecar planner advisories return normalized advisory envelopes.
5. No recurring 5xx in initial post-deploy window.
6. Frontend regression checks pass.

## Rollback Trigger Matrix

Rollback immediately if any trigger occurs:

- Unexpected 500s on critical API paths (3 consecutive checks)
- Valid-origin CORS requests blocked
- Readiness returns not ready
- Crypto trading flow fails in testnet validation
- Critical page/resource 404 after deploy
- PancakeSwap sidecar responses lose normalized envelope fields

## Rollback Procedure (target SLA < 15 minutes)

1. Restore previous file backup.
2. Restore previous env vars.
3. Clear `PANCAKESWAP_AI_*` env vars if adapter rollout caused the incident.
4. Re-run minimal checks:
   - `/api/campaigns.php` authorized
   - `/crypto/backend/api.php?action=account` authorized
   - Vercel `/api/health`
   - homepage + crypto page loads

## Post-Deploy Routine

Daily:

- API availability checks for health endpoints and key actions.

Weekly:

- Review error/latency trends from logs.
- Confirm token configuration and remove temporary fallback `API_TOKEN` when safe.


## InfinityFree Guide

For full InfinityFree step-by-step deployment, see:

- `docs/INFINITYFREE_DEPLOYMENT.md`


