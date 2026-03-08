# InfinityFree Deployment Checklist (`https://refatishere.free.nf`)

Last updated: 2026-03-07

Use this checklist to deploy the current project on InfinityFree with PHP + MySQL fully enabled.

## 0) Inputs to prepare

- `API_TOKEN_LEGACY`
- `API_TOKEN_CRYPTO`
- `PLANNER_SIDECAR_TOKEN` if planner sidecar is enabled
- MySQL credentials from InfinityFree (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`)
- Production origin: `https://refatishere.free.nf`
- Optional Vercel sidecar URL: `https://<your-project>.vercel.app`

## 1) Upload files

Upload these into your website root (`htdocs/`):

- root pages/assets:
  - `index.html`, `about.html`, `projects.html`, `resources.html`, `contact.html`, `Tradejournal.html`, `mom.html`, `mem.html`, `memory.html`
  - `style.css`, `script.js`
- directories:
  - `api/`
  - `crypto/`
  - `images/`
  - `resources/`
  - `docs/`

## 2) Create database and tables

In InfinityFree > MySQL Databases:

1. Create DB + DB user.
2. Open phpMyAdmin.
3. Run SQL from:
   - `deploy/infinityfree/schema.sql`
4. Optional indexes/migration:
   - `api/migrations/2026_03_04_trades_indexes.sql`

## 3) Configure env-style values via `.htaccess`

Create these files from templates:

- `deploy/infinityfree/root.htaccess.example` -> `htdocs/.htaccess`
- `deploy/infinityfree/api.htaccess.example` -> `htdocs/api/.htaccess`
- `deploy/infinityfree/crypto-backend.htaccess.example` -> `htdocs/crypto/backend/.htaccess`

Replace all `REPLACE_*` placeholders.

Important:

- `crypto/backend/.htaccess` must include `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` for 24-hour market cache backup to work.
- If planner sidecar is enabled, include `PLANNER_SIDECAR_URL` and `PLANNER_SIDECAR_TOKEN`.

## 4) Verify readiness URLs

- `https://refatishere.free.nf/api/health.php`
- `https://refatishere.free.nf/crypto/backend/health.php`

Expected: both report ready state.

## 5) Configure crypto UI token

Open `https://refatishere.free.nf/crypto/crypto.html` -> Settings:

- Backend API Token = `API_TOKEN_CRYPTO`
- Binance REST API credentials optional (only needed for account/order actions)
- keep `recvWindow` at default `5000` unless tuning is required

## 6) Run smoke tests

From local repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1 `
  -BaseUrl "https://refatishere.free.nf" `
  -LegacyToken "<API_TOKEN_LEGACY>" `
  -CryptoToken "<API_TOKEN_CRYPTO>" `
  -AllowedOrigin "https://refatishere.free.nf" `
  -SidecarUrl "https://your-project.vercel.app" `
  -SidecarToken "<PLANNER_SIDECAR_TOKEN>"
```

Optional adapter contract validation:

```powershell
node .\scripts\pancakeswap_adapter_contract_test.js
```

## 7) If `SetEnv` is ignored

If readiness endpoints return not ready, use a code fallback config file path (documented in runbook) instead of `.htaccess` variables.

## 8) Post-deploy monitoring (first 24h)

- Recheck readiness endpoints periodically.
- Watch for 5xx, CORS errors, auth failures.
- Re-run smoke tests after any hotfix.
