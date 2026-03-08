# Project Changelog (Documentation Baseline)

Last updated: 2026-03-04

This file tracks major recent project-level changes reflected in current documentation.

## 2026-03 baseline

### Security and reliability

- Token split hardened:
  - `API_TOKEN_LEGACY` for `/api/*`
  - `API_TOKEN_CRYPTO` for `/crypto/backend/*`
- CORS controls and request-id propagation documented and smoke-tested.
- Readiness endpoints added/used in deployment gates:
  - `/api/health.php`
  - `/crypto/backend/health.php`

### API and backend behavior

- `GET /api/trades.php` supports paginated/filter/sort mode while retaining legacy response compatibility.
- Crypto backend added `action=klines` with validation and bounded limit.
- Crypto backend response envelope standardized (`status` + `success` fields).

### Crypto frontend

- Chart upgraded to candle-like price panel + EMA overlays + RSI panel.
- Conservative crossover/RSI signals added.
- Chart readability upgrades:
  - adaptive price range
  - right-axis labels
  - last-price tag
- Chart data reliability model:
  - backend `klines` primary
  - fallback to interval cache
  - source-state badge (`Loading/Proxy/Fallback/Unavailable`)
- Live price formatting updated to Binance-style symbol decimal defaults.

### Frontend quality

- Crypto and legacy UI label/encoding cleanups.
- Expanded smoke tests for frontend availability and mojibake checks.
- Memorial pages consolidated:
  - canonical `mom.html`
  - `mem.html` and `memory.html` redirect shims.

## 2026-03 refinement baseline

### Repository inventory matrix (summary)

| Path group | Role | Owner module | Status |
| --- | --- | --- | --- |
| Root `*.html`, `style.css`, `script.js` | Static web pages + shared UI | Frontend | Active |
| `api/*` | Legacy token-protected MySQL API | Legacy API | Active |
| `crypto/src/*`, `crypto/crypto.html` | Crypto frontend UI and logic | Crypto App | Active |
| `crypto/backend/*` | Crypto token-protected Binance proxy API | Crypto Backend | Active |
| `scripts/smoke_test.ps1` | Deployment regression checks | Ops/QA | Active |
| `docs/*` | Canonical project documentation | Documentation | Active |
| `crypto/docs/*` | Historical module docs/reference notes | Crypto Docs | Mixed (rewrite/pointer) |
| `deploy/infinityfree/*` | Hosting templates and SQL bootstrap | Deployment | Active |

### Risk register

| ID | Priority | Area | Finding | Planned action |
| --- | --- | --- | --- | --- |
| `R-001` | P0 | Crypto backend | Unknown upstream order execution needed deterministic recovery path | Added recoverable error envelope + `action=order-status` path and tests |
| `R-002` | P0 | Crypto backend | Private action timing bounds needed explicit validation | Added strict `recvWindow` validation (`1..60000`) |
| `R-003` | P0 | API observability | Error responses must consistently include request tracing | Verified `request_id` handling in bootstrap JSON paths |
| `R-004` | P1 | Frontend trading UX | Duplicate order submission risk under slow/ambiguous responses | Added submit lock and unknown-status follow-up flow |
| `R-005` | P1 | Documentation | Module docs drifted from current backend contracts | Synced API/docs for `recvWindow`, `newClientOrderId`, `order-status` |
| `R-006` | P2 | Organization | `crypto/docs/*` contains mixed legacy/value docs | Classified for keep/rewrite/pointer in organization docs |
