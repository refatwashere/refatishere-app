# Apps Workspace Strategy

This directory is the target source layout for deployable application surfaces.

It is intentionally lightweight right now. The active runtime files still live in their current locations:

- root public site at repo root
- legacy API at `api/`
- crypto app at `crypto/`
- planner sidecar at `vercel-sidecar/`

The intended long-term source layout is:

- `apps/site/`
- `apps/legacy-api/`
- `apps/crypto/`
- `apps/planner-sidecar/`

Important constraint:

- Source layout may change later.
- Public deployment paths must not change.

That means deployment packaging must continue to emit:

- `/index.html`, `/about.html`, `/projects.html`, `/resources.html`, `/contact.html`
- `/api/*`
- `/crypto/crypto.html`
- `/crypto/backend/*`
- sidecar `/api/health` and `/api/planner`

Use `scripts/build_deploy_bundle.ps1` to package the current repo into upload-ready folders while the source tree is in transition.

Current bundle outputs:

- `output/deploy-package/upload-to-infinityfree-htdocs/`
- `output/deploy-package/optional-upload-public-docs/` when `-IncludeDocs` is used
- `output/deploy-package/upload-to-vercel-sidecar/`

The packaging script keeps these outputs in sync with the current command flags. If `-IncludeDocs` is omitted on a rebuild, the optional docs upload folder is removed instead of being left behind as stale output.
