---
name: project-analysis-docs
description: Use when analyzing entire codebase structure, identifying documentation gaps, and creating/updating comprehensive project documentation. Ideal for project reviews, onboarding guides, architecture documentation, and quality audits.
---

# Project Analysis & Documentation Excellence

A systematic workflow for analyzing code organization, architectural patterns, and documentation completeness—then generating high-quality documentation artifacts.

## When to Use

**Perfect for**:
- ✅ Full project reviews and audits
- ✅ Onboarding new team members
- ✅ Identifying documentation gaps
- ✅ Creating API references and examples
- ✅ Documenting data models and schemas
- ✅ Architecture review and refinement
- ✅ Writing deployment/troubleshooting guides

**Not for**:
- ❌ Small file edits
- ❌ Single component changes
- ❌ Bug fixes (use standard agent)

## Workflow Steps

### Phase 1: Codebase Discovery (Read-Only)
1. **Map structure**: Explore all directories, file counts, purpose of each module
2. **Identify tech stack**: Languages, frameworks, external dependencies, integrations
3. **Catalog components**: Data models, endpoints, UI sections, services
4. **Extract patterns**: Authentication, request/response formats, error handling, config management
5. **Note dependencies**: Internal module interactions, external API calls, data flow
6. **Find gaps**: Missing docs, code comments, schema diagrams, examples

### Phase 2: Analysis & Assessment
1. **Create inventory**: Count files by type, lines of code, documentation coverage
2. **Assess quality**: Code consistency, naming conventions, architectural clarity
3. **Identify workflows**: User journeys, integration flows, deployment sequences
4. **Evaluate resilience**: Error handling, fallback strategies, recovery mechanisms
5. **Security review**: Authentication, authorization, data protection patterns
6. **Scalability check**: Single points of failure, resource constraints, bottlenecks

### Phase 3: Documentation Production
1. **Prioritize gaps**: Focus on highest-impact missing docs (API examples, schemas, troubleshooting)
2. **Choose formats**: 
   - API: OpenAPI 3.0 + cURL examples
   - Data models: ER diagrams + JSON schema
   - Guides: Step-by-step procedures with screenshots
   - Troubleshooting: Error catalog with resolutions
3. **Create artifacts**: Generate docs in appropriate locations
4. **Cross-reference**: Link related docs, maintain single source of truth
5. **Validate**: Review for accuracy, completeness, consistency

### Phase 4: Quality Assurance
1. **Completeness check**: All key topics covered, no orphaned pages
2. **Accuracy verification**: Examples tested, commands valid, screenshots current
3. **Clarity review**: Plain language, consistent terminology, logical flow
4. **Link validation**: All internal references work, no dead links
5. **Accessibility**: Proper heading hierarchy, alt text, keyboard navigation

## Key Documentation Artifacts

| Artifact | Purpose | Format | Location |
|----------|---------|--------|----------|
| **Architecture Overview** | System design, module responsibilities | Markdown + Diagram | `docs/ARCHITECTURE.md` |
| **API Reference** | Endpoint contracts, request/response examples | OpenAPI 3.0 + cURL | `docs/API_REFERENCE.md` |
| **Data Models** | Database schema, JSON structures | ER diagram + JSON schema | `docs/DATA_MODELS.md` |
| **Error Catalog** | All error codes, causes, resolutions | Markdown table | `docs/TROUBLESHOOTING.md` |
| **Deployment Guide** | Step-by-step deployment procedures | Markdown + checklist | `docs/DEPLOYMENT.md` |
| **Developer Guide** | Code structure, conventions, patterns | Markdown + examples | `docs/DEVELOPER_GUIDE.md` |
| **Integration Guide** | How to integrate with external systems | Step-by-step + examples | `docs/INTEGRATIONS.md` |
| **Troubleshooting** | Common issues, diagnosis, solutions | FAQ + decision trees | `docs/TROUBLESHOOTING.md` |

## Analysis Template

Use this structure to organize findings:

```
## Project Overview
- **Name**: [Project name]
- **Purpose**: [One-line description]
- **Status**: [Development/Stable/Maintenance]
- **Tech Stack**: [Languages, frameworks, databases]

## Directory Structure
| Path | Purpose | Type | Owner |
|------|---------|------|-------|

## Key Components
| Component | Purpose | Location | Responsibility |
|-----------|---------|----------|-----------------|

## Data Models
[Tables, schemas, relationships]

## API Endpoints
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|

## Integration Points
[How modules communicate, external systems]

## Patterns & Conventions
[Authentication, error handling, config management]

## Documentation Assessment
### Strengths
✅ [Well-documented areas]

### Gaps
⚠️ [Missing documentation]

### Recommendations
1. [Priority 1]
2. [Priority 2]

## Metrics
- Total files: [count]
- Lines of code: [by language]
- Documentation coverage: [percentage]
- Test coverage: [percentage]
```

## Quality Checklist

Before finalizing documentation:

- [ ] All endpoints have request/response examples
- [ ] Data models documented with ER diagrams or schema
- [ ] Error codes listed with causes and resolutions
- [ ] Deployment steps are tested and reproducible
- [ ] All links are valid (no 404s or dead anchors)
- [ ] Code examples are syntactically correct and tested
- [ ] Terminology is consistent throughout
- [ ] Graphs/diagrams are clear and labeled
- [ ] Accessibility standards met (headings, alt text)
- [ ] README files exist in all major directories

## Project Analysis Output

For each project analysis, produce:

1. **PROJECT_ANALYSIS.md** - Executive summary of findings
2. **Documentation Priority Matrix** - Ranked list of docs to create/update
3. **Architecture Diagram** - System design visualization
4. **Missing Docs Inventory** - Detailed gap analysis
5. **Updated Docs** - New/revised documentation files

## Integration with Deployment

This workflow pairs with deployment processes:
- Updated docs → Included in release
- API examples → Added to deploy runbook
- User guides → Linked in deployment notification
- Troubleshooting → Team knowledge base

## Example Prompts

```
/project-analysis review the entire codebase structure and filesystem organization

/project-analysis identify all documentation gaps and create a priority matrix

/project-analysis create comprehensive API documentation with examples

/project-analysis document all data models and create ER diagrams

/project-analysis write deployment troubleshooting guide for production issues

/project-analysis create developer onboarding guide for new team members
```

## Assets

Store reusable templates in `.github/skills/project-analysis-docs/`:

- `api-spec-template.yaml` - OpenAPI 3.0 template
- `deployment-guide-template.md` - Deployment guide template
- `troubleshooting-template.md` - Troubleshooting guide template
- `data-model-template.md` - Data model documentation template
- `developer-guide-template.md` - Developer guide template
