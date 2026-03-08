# Documentation Index

Current documentation is split into three layers:

- **Canonical** — current source-of-truth docs in `docs/`
- **Reference** — supporting guides in `docs/reference/`
- **Release History / Archive** — historical material in `docs/release-history/`, `docs/archive/`, and repo-level `archive/`

## Canonical Docs

- [Project Genome](PROJECT_GENOME.md)
- [Architecture](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Deployment and Operations](DEPLOYMENT_AND_OPERATIONS.md)
- [Static Site Deployment and Testing](STATIC_SITE_DEPLOYMENT_AND_TESTING.md)
- [InfinityFree Deployment](INFINITYFREE_DEPLOYMENT.md)
- [Planner Operator Checklist](PLANNER_OPERATOR_CHECKLIST.md)
- [Crypto App](CRYPTO_APP.md)
- [AI Planner Architecture](AI_PLANNER_ARCHITECTURE.md)
- [Project Organization](PROJECT_ORGANIZATION.md)
- [Project Changelog](CHANGELOG_PROJECT.md)

Folder purpose notes:

- [`docs/`](.) — current source of truth
- [`docs/reference/`](reference/README.md) — supporting implementation detail
- [`docs/release-history/`](release-history/README.md) — historical release context
- [`docs/archive/`](archive/README.md) — superseded but retained docs

## Reference Docs

- [API Examples](reference/API_EXAMPLES.md)
- [Data Models](reference/DATA_MODELS.md)
- [Error Catalog](reference/ERROR_CATALOG.md)
- [Frontend Pages](reference/FRONTEND_PAGES.md)
- [InfinityFree Deployment Commands](reference/INFINITYFREE_DEPLOYMENT_COMMANDS.md)
- [PancakeSwap Adaptation Guide](reference/PANCAKESWAP_ADAPTATION_GUIDE.md)
- [PancakeSwap AI Adapter Contract](reference/PANCAKESWAP_AI_ADAPTER_CONTRACT.md)
- [PancakeSwap Planner UX](reference/PANCAKESWAP_PLANNER_UX.md)
- [Performance Tuning](reference/PERFORMANCE_TUNING.md)
- [Planner Request / Response](reference/PLANNER_REQUEST_RESPONSE.md)
- [Sidecar API Contract](reference/SIDECAR_API_CONTRACT.md)
- [Sidecar Deployment Config](reference/SIDECAR_DEPLOYMENT_CONFIG.md)

## Release History

- [Frontend Regression Checklist](release-history/FRONTEND_REGRESSION_CHECKLIST.md)
- [Phase 0 Baseline Freeze](release-history/PHASE0_BASELINE_FREEZE.md)
- [Phase 6 Documentation Index](release-history/PHASE6_DOCUMENTATION_INDEX.md)
- [Phase 6 Release Gating Checklist](release-history/PHASE6_RELEASE_GATING_CHECKLIST.md)
- [Project Completion Summary](release-history/PROJECT_COMPLETION_SUMMARY.md)

## Archived Docs

- [Deployment Options (Superseded)](archive/DEPLOYMENT_OPTIONS_FREE.md)
- [Project Analysis Summary (Historical)](archive/PROJECT_ANALYSIS_SUMMARY.md)

## Repo-Level Archive

See `../archive/README.md` for:

- legacy sidecar assets
- session/chat artifacts
- superseded root-level reports

## Placement Checklist

When adding a new document, place it by intent:

- current contract or operational truth → `docs/`
- examples, models, troubleshooting, or deep implementation reference → `docs/reference/`
- milestone, sign-off, or rollout snapshot → `docs/release-history/`
- superseded, one-off, or historical material → `docs/archive/` or `../archive/`

## Recommended Reading Paths

### First-time orientation
1. [../README.md](../README.md)
2. [PROJECT_GENOME.md](PROJECT_GENOME.md)
3. [ARCHITECTURE.md](ARCHITECTURE.md)
4. [DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md)

### API work
1. [API_REFERENCE.md](API_REFERENCE.md)
2. [reference/API_EXAMPLES.md](reference/API_EXAMPLES.md)
3. [reference/PLANNER_REQUEST_RESPONSE.md](reference/PLANNER_REQUEST_RESPONSE.md)
4. [reference/SIDECAR_API_CONTRACT.md](reference/SIDECAR_API_CONTRACT.md)

### Deployment work
1. [DEPLOYMENT_AND_OPERATIONS.md](DEPLOYMENT_AND_OPERATIONS.md)
2. [STATIC_SITE_DEPLOYMENT_AND_TESTING.md](STATIC_SITE_DEPLOYMENT_AND_TESTING.md)
3. [INFINITYFREE_DEPLOYMENT.md](INFINITYFREE_DEPLOYMENT.md)
4. [reference/SIDECAR_DEPLOYMENT_CONFIG.md](reference/SIDECAR_DEPLOYMENT_CONFIG.md)

### Historical validation or release context
1. [release-history/PHASE0_BASELINE_FREEZE.md](release-history/PHASE0_BASELINE_FREEZE.md)
2. [release-history/PHASE6_RELEASE_GATING_CHECKLIST.md](release-history/PHASE6_RELEASE_GATING_CHECKLIST.md)
3. [archive/PROJECT_ANALYSIS_SUMMARY.md](archive/PROJECT_ANALYSIS_SUMMARY.md)
