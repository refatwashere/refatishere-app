# Refat Is Here App

This project combines a personal/public static site, a PHP + MySQL legacy API, a richer crypto workspace, and an optional Vercel planner sidecar.

The public root pages present the personal portfolio and downloadable resources. The technical side of the repo includes:

- `api/` for legacy PHP endpoints
- `crypto/` for the main crypto workspace and PHP backend
- `vercel-sidecar/` for optional planner-sidecar deployment

Repository organization follows deployable surfaces, not generic `frontend/` and `backend/` buckets. The long-term target is an `apps/*` source layout, but the current runtime files remain in place until deployment is fully artifact-based.

## Project Shape

### Public root site

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

### Backend/runtime areas

- `api/`
- `crypto/`
- `vercel-sidecar/`

### Static assets

- `images/`
- `resources/`
- `docs/`

## Local Preview

To preview the public site locally:

```powershell
python -m http.server 8123
```

Then open:

- `http://127.0.0.1:8123/index.html`
- `http://127.0.0.1:8123/crypto/crypto.html`

## Deploy Packaging

Build a deployable bundle that preserves the current public URL structure:

```powershell
.\scripts\build_deploy_bundle.ps1 -Clean -IncludeDocs
```

This writes upload-ready folders to `output/deploy-package/`:

- `upload-to-infinityfree-htdocs/` for direct upload into InfinityFree `htdocs/`
- `optional-upload-public-docs/` if `-IncludeDocs` is used
- `upload-to-vercel-sidecar/` for the separate Vercel deployable

The script is designed to keep working if the source tree later moves into `apps/site`, `apps/legacy-api`, `apps/crypto`, and `apps/planner-sidecar`.
It also keeps bundle output aligned with the current command flags, so optional docs are removed from the package when `-IncludeDocs` is not used.

## Environment Contracts

Reference the example files before deployment:

- [api/.env.example](api/.env.example)
- [crypto/backend/.env.example](crypto/backend/.env.example)

Key required values:

- `API_TOKEN_LEGACY`
- `API_TOKEN_CRYPTO`
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `ALLOWED_ORIGINS`

## Deployment and Testing Docs

Start with these:

- [docs/STATIC_SITE_DEPLOYMENT_AND_TESTING.md](docs/STATIC_SITE_DEPLOYMENT_AND_TESTING.md)
- [docs/CURRENT_STATUS_AND_TASK_LIST.md](docs/CURRENT_STATUS_AND_TASK_LIST.md)
- [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md)
- [docs/INFINITYFREE_DEPLOYMENT.md](docs/INFINITYFREE_DEPLOYMENT.md)
- [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)
- [docs/REPOSITORY_STRUCTURE_STRATEGY.md](docs/REPOSITORY_STRUCTURE_STRATEGY.md)

## Current Notes

- The root site is ready for static hosting with PHP-backed directories deployed alongside it.
- `Tradejournal.html` still uses CDN-hosted Tailwind and Chart.js.
- `tmp/` and `output/` are treated as generated local artifacts and are ignored in git.
- The crypto workspace UI no longer uses `v10` branding.
- Published GitHub remote:
  - `https://github.com/refatwashere/refatishere-app`
