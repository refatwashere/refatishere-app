# Project Organization

Last updated: 2026-03-07

This document defines the active, reference, and archived structure of the repository.

## Active Areas

| Area | Paths | Purpose |
| --- | --- | --- |
| Root frontend | `*.html`, `style.css`, `script.js` | Public website UX |
| Legacy API | `api/*` | Public legacy API behavior |
| Crypto app | `crypto/*` | Trading UI and PHP backend |
| Deploy helpers | `deploy/*`, `scripts/*`, `DEPLOY_RUNBOOK.md`, `DEPLOYMENT_STATUS.md` | Deployment and validation |
| Canonical docs | `docs/*.md` | Current source of truth |
| Vercel sidecar | `vercel-sidecar/*` | Active planner sidecar |

## Supporting Areas

| Area | Paths | Purpose |
| --- | --- | --- |
| Reference docs | `docs/reference/*` | Supporting examples, models, troubleshooting, sidecar detail |
| Release history | `docs/release-history/*` | Historical release and gating material |
| Archived docs | `docs/archive/*` | Superseded summaries and older planning docs |
| Repo archive | `archive/*` | Session artifacts, reports, and quarantined legacy assets |

## Legacy Quarantine

- The old Node/Railway sidecar is retained under `archive/legacy-sidecar/sidecar/`.
- It is historical/alternate material only and must not be presented as the default deployment path.
- `vercel-sidecar/` is the only active sidecar implementation in current docs.

## Organization Rules

1. New current-state contracts belong in canonical `docs/` first.
2. Supporting examples and deep references go in `docs/reference/`.
3. Release-phase or sign-off material goes in `docs/release-history/`.
4. Superseded reports, chat logs, and one-off status documents go in `archive/`.
5. Active docs must not present archived or legacy material as primary guidance.
6. Runtime behavior changes must not depend on archived files.
7. Root files should exist only when they are part of the deployable site/app surface or are top-level operator entry docs.
8. Generated outputs and transient diagnostics should be ignored or written outside the active root surface.

## Placement Rules for New Files

- **Runtime assets**: keep at root only if deployment currently expects them there.
- **Current docs**: place in `docs/` root when they define active behavior, architecture, or operations.
- **Deep references**: place in `docs/reference/` when they support implementation but do not define the primary contract.
- **Release snapshots**: place in `docs/release-history/`.
- **Obsolete/session/report material**: place in `archive/`.
