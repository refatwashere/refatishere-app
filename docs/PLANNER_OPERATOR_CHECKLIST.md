# Planner Operator Checklist

Last updated: 2026-03-07

Use this checklist during rollout, incident response, and post-deploy validation for the planner stack.

## Pre-Deploy

- Confirm `PLANNER_SIDECAR_URL` points to the target Vercel `/api/planner`.
- Confirm `PLANNER_SIDECAR_TOKEN` matches between InfinityFree and Vercel.
- Decide adapter mode:
  - disabled = no `PANCAKESWAP_AI_*` vars
  - enabled = `PANCAKESWAP_AI_API_URL` set, optional key and timeout configured
- Run local adapter contract validation:
  - `node scripts/pancakeswap_adapter_contract_test.js`

## Direct Sidecar Checks

- `GET /` returns the same ready JSON as `/api/health`
- `GET /api/health` returns:
  - `data.ready = true`
  - `data.adapter.pancakeswap_ai_enabled`
  - `data.adapter.timeout_ms`
- `POST /api/planner` Binance returns a planner advisory:
  - `data.trade_intent.venue = "binance"`
  - `data.meta.adapter_status = "native"`
- `POST /api/planner` PancakeSwap returns a planner advisory:
  - `data.trade_intent.venue = "pancakeswap"`
  - `data.meta.adapter`
  - `data.meta.adapter_status`

## Backend Proxy Checks

- `POST /crypto/backend/api.php?action=planner-intent` with `provider=sidecar`, `venue=binance` returns:
  - success envelope
  - `data.meta.source = "sidecar"`
  - `data.meta.adapter_status = "native"`
- `POST /crypto/backend/api.php?action=planner-intent` with `provider=sidecar`, `venue=pancakeswap` returns:
  - success envelope
  - normalized `trade_intent`, `execution_plan`, `risk_assessment`
  - adapter provenance in `data.meta`

## Frontend Checks

- Planner advisories can be enabled from Settings.
- Trading tab planner workspace renders for both venues.
- Binance planner results show confidence, steps, and risk flags.
- PancakeSwap planner results show route, deep link, and adapter provenance.
- Planner failures do not block manual Binance order flow.

## Adapter State Guide

- **Disabled**
  - `data.meta.adapter = "local-fallback"`
  - `data.meta.adapter_status = "local-only"` or `fallback`
  - acceptable if fallback-only mode is intentional
- **Healthy**
  - `data.meta.adapter = "pancakeswap-ai"`
  - `data.meta.adapter_status = "active"` or `"partial-normalized"`
- **Unhealthy**
  - `data.meta.adapter = "local-fallback"`
  - `data.meta.adapter_status = "fallback"`
  - inspect `data.meta.adapter_failure_reason`
  - rollback adapter env vars if this was not expected

## Release Gate

- `scripts/smoke_test.ps1` passes with sidecar parameters
- `scripts/integration_test.ps1 -FullTest` passes
- No recurring 5xx during the initial monitoring window
- Operator confirms intended adapter mode matches observed `adapter_status`
