# Static Site Deployment and Testing Runbook

Last updated: 2026-03-09

Use this runbook when deploying the current public site and validating that the root pages, PHP APIs, crypto workspace, and downloadable assets are all working together.

This guide is intentionally precise for the current repo state. It assumes:

- public domain: `https://refatishere.free.nf`
- PHP + MySQL hosting on InfinityFree for the main site
- optional Vercel deployment for `vercel-sidecar/`

## 1. Deployable scope

For this version, the public-facing static site is:

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
- `images/`
- `resources/`

Backend/runtime directories that must stay aligned with the public site:

- `api/`
- `crypto/`
- optional `vercel-sidecar/`

## 2. Required deployment inputs

Prepare these values before uploading anything:

- `API_TOKEN_LEGACY`
- `API_TOKEN_CRYPTO`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `DB_CHARSET`
- `ALLOWED_ORIGINS`

Optional values:

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`
- `PANCAKESWAP_AI_API_URL`
- `PANCAKESWAP_AI_API_KEY`
- `PANCAKESWAP_AI_TIMEOUT_MS`

Recommended production values:

- `ALLOWED_ORIGINS=https://refatishere.free.nf`
- `DB_PORT=3306`
- `DB_CHARSET=utf8mb4`

## 3. Pre-deploy local verification

Run these checks from repo root before uploading:

Optional: build a deploy bundle first if you want a package that preserves public paths while decoupling deployment from the raw source tree:

```powershell
.\scripts\build_deploy_bundle.ps1 -Clean -IncludeDocs
```

This writes upload-ready folders to `output/deploy-package/`:

- `upload-to-infinityfree-htdocs/` for direct upload into `htdocs/`
- `optional-upload-public-docs/` for optional public docs hosting
- `upload-to-vercel-sidecar/` for the separate sidecar deployment

If you use that flow, upload from the generated target folder instead of directly from repo root.
If you rebuild later without `-IncludeDocs`, the optional docs upload folder is removed so the bundle does not carry stale docs forward.

1. Start a local static server for root-page verification:

```powershell
python -m http.server 8123
```

2. Open and verify these routes locally:

- `http://127.0.0.1:8123/index.html`
- `http://127.0.0.1:8123/about.html`
- `http://127.0.0.1:8123/projects.html`
- `http://127.0.0.1:8123/resources.html`
- `http://127.0.0.1:8123/contact.html`
- `http://127.0.0.1:8123/Tradejournal.html`
- `http://127.0.0.1:8123/mom.html`
- `http://127.0.0.1:8123/mem.html`
- `http://127.0.0.1:8123/memory.html`
- `http://127.0.0.1:8123/crypto/crypto.html`

3. Confirm these static assets load directly:

- `http://127.0.0.1:8123/images/rise-within-placeholder.svg`
- `http://127.0.0.1:8123/images/aq-test-placeholder.svg`
- `http://127.0.0.1:8123/images/teacher-connect-placeholder.svg`
- `http://127.0.0.1:8123/resources/StdVI_Math_Worksheet.pdf`
- `http://127.0.0.1:8123/resources/IELTS_Vocab_Sample.pdf`
- `http://127.0.0.1:8123/resources/ClassRoutine_Template.pdf`

4. Confirm redirect behavior:

- `mem.html` redirects to `mom.html`
- `memory.html` redirects to `mom.html`

5. Confirm current frontend expectations:

- shared top nav shows: `Home`, `About`, `Projects`, `Resources`, `Mom`, `Binance Tool`, `Contact`
- the homepage shows the expanded content sections
- `Tradejournal.html` tabs switch correctly and the add-trade modal opens/closes
- `crypto/crypto.html` still loads its own separate styling and behavior

## 4. Backup before touching production

Before upload:

1. Download a full copy of current `htdocs/`.
2. Save current `.htaccess` files from:
   - `htdocs/.htaccess`
   - `htdocs/api/.htaccess`
   - `htdocs/crypto/backend/.htaccess`
3. Export or record current MySQL credentials and API tokens.
4. If sidecar is enabled, record the current Vercel URL and token.

Do not skip this. Rollback is much faster if the backup already exists.

## 5. Files to upload to InfinityFree

Preferred upload source:

- current direct source layout from repo root, or
- `output/deploy-package/upload-to-infinityfree-htdocs/` after running `.\scripts\build_deploy_bundle.ps1 -Clean`
- `output/deploy-package/optional-upload-public-docs/` only if you intentionally want docs public

If using the bundle flow, upload the contents of `output/deploy-package/upload-to-infinityfree-htdocs/` into `htdocs/`.

That folder is intentionally pre-filtered so you do not have to choose files manually.

It contains these root files:

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

Upload these directories into `htdocs/`:

- `api/`
- `crypto/`
- `images/`
- `resources/`
- `docs/`

If replacing an existing deployment, overwrite the uploaded files with this repo version.

## 6. Database setup

In InfinityFree:

1. Create or confirm the target MySQL database and user.
2. Open phpMyAdmin.
3. Run:

```sql
deploy/infinityfree/schema.sql
```

4. Optional but recommended if the migration file exists in your deployment package:

```sql
api/migrations/2026_03_04_trades_indexes.sql
```

Expected tables from the main schema:

- `trades`
- `journal_entries`
- `campaigns`
- `simple_earn`
- `market_kline_cache`

## 7. Environment configuration via `.htaccess`

Create these files from the examples:

- `deploy/infinityfree/root.htaccess.example` -> `htdocs/.htaccess`
- `deploy/infinityfree/api.htaccess.example` -> `htdocs/api/.htaccess`
- `deploy/infinityfree/crypto-backend.htaccess.example` -> `htdocs/crypto/backend/.htaccess`

Replace every placeholder value before testing.

### `htdocs/api/.htaccess` must define

- `API_TOKEN_LEGACY`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `DB_CHARSET`
- `ALLOWED_ORIGINS`

Optional:

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`

### `htdocs/crypto/backend/.htaccess` must define

- `API_TOKEN_CRYPTO`
- `BINANCE_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `DB_CHARSET`
- `ALLOWED_ORIGINS`

Optional:

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`
- `PANCAKESWAP_AI_API_URL`
- `PANCAKESWAP_AI_API_KEY`
- `PANCAKESWAP_AI_TIMEOUT_MS`

Important:

- keep `BINANCE_BASE_URL=https://api.binance.com` unless you intentionally need another endpoint
- include DB settings in the crypto backend config so cache fallback continues to work
- if you do not use the sidecar, leave the sidecar values empty rather than inventing placeholders

## 8. Optional sidecar deployment

Deploy `vercel-sidecar/` only if planner sidecar mode is needed.

After deploy, verify:

- `GET https://<your-sidecar>.vercel.app/api/health`
- direct `POST https://<your-sidecar>.vercel.app/api/planner`

Then set these in both PHP environments if the sidecar will be used:

- `PLANNER_SIDECAR_URL`
- `PLANNER_SIDECAR_TOKEN`

## 9. Production readiness checks

After upload, open these URLs directly:

- `https://refatishere.free.nf/`
- `https://refatishere.free.nf/about.html`
- `https://refatishere.free.nf/projects.html`
- `https://refatishere.free.nf/resources.html`
- `https://refatishere.free.nf/contact.html`
- `https://refatishere.free.nf/Tradejournal.html`
- `https://refatishere.free.nf/mom.html`
- `https://refatishere.free.nf/mem.html`
- `https://refatishere.free.nf/memory.html`
- `https://refatishere.free.nf/crypto/crypto.html`
- `https://refatishere.free.nf/api/health.php`
- `https://refatishere.free.nf/crypto/backend/health.php`

Expected results:

- public pages load with no missing CSS/JS
- `mem.html` and `memory.html` resolve to `mom.html`
- `api/health.php` returns success JSON
- `crypto/backend/health.php` returns success JSON and reports ready when config is correct

## 10. Required smoke tests

Run the included smoke script from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1 `
  -BaseUrl "https://refatishere.free.nf" `
  -LegacyToken "<API_TOKEN_LEGACY>" `
  -CryptoToken "<API_TOKEN_CRYPTO>" `
  -SidecarToken "<PLANNER_SIDECAR_TOKEN>"
```

What this script currently verifies:

- legacy health endpoint
- crypto health endpoint
- crypto `klines` POST when `CryptoToken` is supplied
- legacy `trades.php` GET when `LegacyToken` is supplied
- response tracing should use the same request id in both the `X-Request-Id` header and JSON payload

If sidecar is in use, also manually verify:

- sidecar health endpoint returns success
- planner flow works from `crypto/crypto.html`

## 11. Manual frontend test matrix

Check these on desktop and mobile widths:

### Root public site

- homepage hero, stats strip, and expanded content sections render correctly
- nav wrapping does not break layout on smaller screens
- active nav highlighting works
- footer stays aligned with the same visual container as nav and main content

### Projects page

- all three placeholder SVG images load
- Binance workspace and journal CTAs resolve correctly

### Resources page

- all six download links return `200`
- PDF downloads open or save correctly
- TXT downloads open or save correctly

### Contact page

- inputs are readable and aligned
- clicking `Submit` shows the fallback email message
- mailto link opens correctly

### Memorial routes

- `mom.html` displays the counter and daily quote
- `mem.html` and `memory.html` redirect properly

### Standalone journal

- `Tradejournal.html` loads charts and tabs
- tabs switch with mouse and keyboard
- modal opens and closes
- add-trade flow updates the table and summary

### Crypto workspace

- page loads without root-site styling leaking into it
- settings panel is usable
- watchlist and chart area render
- `Backend API Token` can be entered and saved

## 12. Pass criteria

Deployment is acceptable only if all of these are true:

1. All public HTML routes load successfully.
2. `style.css`, `script.js`, `images/`, and `resources/` are all reachable.
3. `api/health.php` returns success.
4. `crypto/backend/health.php` returns success and ready.
5. `scripts/smoke_test.ps1` completes without failure.
6. `mem.html` and `memory.html` redirect to `mom.html`.
7. `Tradejournal.html` interactive behaviors still work.
8. `crypto/crypto.html` still renders independently of root-page styling.

## 13. Rollback procedure

Rollback immediately if any of these happen:

- critical public page returns 404 or broken layout
- CSS/JS fails to load
- readiness endpoints return failure after config correction
- smoke tests fail on previously healthy routes
- resources or images are missing after upload

Rollback steps:

1. Restore the full `htdocs/` backup.
2. Restore prior `.htaccess` files.
3. Restore previous env values.
4. Recheck:
   - homepage
   - `api/health.php`
   - `crypto/backend/health.php`
   - `crypto/crypto.html`

## 14. Known non-blocking notes

- The root site currently does not ship a `favicon.ico`. Browsers may log a missing favicon request; this is not a deployment blocker.
- `Tradejournal.html` still uses Tailwind CDN and Chart.js CDN. If either external CDN is blocked, that page may degrade even if the rest of the site is healthy.
