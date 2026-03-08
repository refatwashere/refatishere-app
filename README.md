# Refat Is Here App

This project combines a personal/public static site, a PHP + MySQL legacy API, a richer crypto workspace, and an optional Vercel planner sidecar.

The public root pages present the personal portfolio and downloadable resources. The technical side of the repo includes:

- `api/` for legacy PHP endpoints
- `crypto/` for the main crypto workspace and PHP backend
- `vercel-sidecar/` for optional planner-sidecar deployment

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
- [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md)
- [docs/INFINITYFREE_DEPLOYMENT.md](docs/INFINITYFREE_DEPLOYMENT.md)
- [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)

## Current Notes

- The root site is ready for static hosting with PHP-backed directories deployed alongside it.
- `Tradejournal.html` still uses CDN-hosted Tailwind and Chart.js.
- `tmp/` and `output/` are treated as generated local artifacts and are ignored in git.
