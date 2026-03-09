# Repository Structure Strategy

Last updated: 2026-03-09

## Decision

The repository should be organized by deployable surface, not by generic technology layers such as `frontend/` and `backend/`.

That means the preferred long-term shape is:

- `apps/site/`
- `apps/legacy-api/`
- `apps/crypto/`
- `apps/planner-sidecar/`
- `deploy/`
- `docs/`
- `scripts/`

## Why This Boundary Is Correct

- The project deploys as multiple runtime surfaces, not as one unified frontend plus one unified backend.
- `crypto/` is a single product surface with its own frontend and backend that should stay together.
- The root public site is the only major active surface still living as loose root files.
- Current hosting depends on path-sensitive public URLs, so any source move must preserve deployment output paths.

## Current State

The active repo layout remains:

- root public site at repo root
- legacy API at `api/`
- crypto app at `crypto/`
- planner sidecar at `vercel-sidecar/`

This is still the canonical runtime layout for source files today.

## Migration Path

### Stage 1

Keep current runtime files where they are.

### Stage 2

Package deploy artifacts through `scripts/build_deploy_bundle.ps1`.

This script supports the current source layout and is also ready for a future source move to:

- `apps/site/`
- `apps/legacy-api/`
- `apps/crypto/`
- `apps/planner-sidecar/`

Current upload-ready outputs:

- `output/deploy-package/upload-to-infinityfree-htdocs/`
- `output/deploy-package/optional-upload-public-docs/` when docs are included
- `output/deploy-package/upload-to-vercel-sidecar/`

The bundle script is state-aware rather than append-only. Rebuilding without `-IncludeDocs` removes the optional docs upload folder so operators do not accidentally upload stale docs from a prior bundle.

### Stage 3

Move source files into `apps/*` only when deployment is artifact-based rather than relying on direct upload from repo root.

## Public Path Contract

Any source reorganization must preserve these deployment paths:

- `/index.html`
- `/about.html`
- `/projects.html`
- `/resources.html`
- `/contact.html`
- `/Tradejournal.html`
- `/mom.html`
- `/mem.html`
- `/memory.html`
- `/style.css`
- `/script.js`
- `/images/*`
- `/resources/*`
- `/api/*`
- `/crypto/crypto.html`
- `/crypto/backend/*`
- sidecar `/api/health`
- sidecar `/api/planner`

## Validation

After any structural move or packaging change, verify:

- root pages load from the same public URLs
- `/api/health.php` works
- `/crypto/crypto.html` loads independently
- `/crypto/backend/health.php` works
- crypto frontend still resolves both `../../api/*` and `../backend/api.php`
- sidecar still deploys independently on Vercel
- deployment docs still match the actual release flow
- request IDs remain consistent between response headers and JSON payloads for both PHP API surfaces
