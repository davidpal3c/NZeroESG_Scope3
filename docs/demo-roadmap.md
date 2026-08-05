# NZeroESG Demo-Readiness Roadmap

## Decision summary

NZeroESG will be rebuilt from commit `4eed03c` as a lean modular monolith, not
continued as a GraphQL or microservice migration.

The product will demonstrate one defensible workflow:

> A procurement or logistics user uploads shipment data and supplier evidence,
> receives traceable freight-emissions and supplier analysis, compares
> alternatives, and exports a decision-ready report.

The assistant may help explain and navigate the workflow, but deterministic
code owns calculations, filtering, ranking inputs, citations, and report data.

## Persistent objective

Turn NZeroESG into a lean, portfolio-ready, publicly demoable Scope 3 freight
and supplier-evidence prototype that stays maintainable by one human and costs
no more than $30 USD per month beyond existing ChatGPT/Codex access.

The objective is complete when a new demo user can:

1. Enter an isolated, expiring demo workspace.
2. Upload a supported shipment CSV.
3. Upload at least one real text-based supplier or compliance document.
4. See deterministic emissions calculations with factor sources and
   assumptions.
5. Search and compare suppliers using structured attributes and cited document
   evidence.
6. View useful cards and charts.
7. Export a decision report.
8. Complete the workflow on the public deployment while automated smoke and
   end-to-end checks pass.

## Primary demo journey

The portfolio demo should take roughly five minutes:

1. Open the site and choose **Enter demo workspace**.
2. Upload a sample or local shipment CSV.
3. Review validation errors and the normalized shipment table.
4. See baseline totals, mode breakdown, hotspots, and data-quality warnings.
5. Upload a supplier sustainability or certification PDF.
6. Open supplier cards showing structured facts and document citations.
7. Compare a baseline shipment with one or more lower-emission scenarios.
8. Export or print a report containing inputs, methodology, evidence, results,
   and caveats.

The demo must still work when the optional LLM feature is disabled.

## Scope decisions

| Candidate | Decision for the prototype |
| --- | --- |
| `/login` and authentication | Build a clearly labelled demo-access flow using a server-issued, signed session and isolated expiring workspace. Do not build production identity management yet. |
| Functional portal | Build one focused workspace dashboard: Overview, Shipments, Suppliers/Evidence, Scenarios, and Report. |
| CSV upload | Required. Support one documented schema, downloadable template, row validation, and a conservative row limit. |
| File/document upload | Required. Start with text-based PDF and optionally DOCX/TXT. Do not add OCR or scanned-document support. |
| Reports | Required. Build a printable HTML report and CSV export first; avoid a separate report service. |
| Charts/Recharts | Include a small set of decision-useful charts: emissions by mode, top shipment hotspots, and scenario comparison. |
| Supplier cards and metadata | Required. Show source status, certifications, region, transport modes, evidence links, data freshness, and missing fields. |
| Quick replies | Include only after the core workflow works. Quick replies should trigger explicit product actions, not decorative prompts. |
| Confidence/source/time | Always show sources and processing time. Replace uncalibrated “confidence” with evidence completeness and data-quality status. |
| Memory isolation | Required. Remove process-global user memory. Store only workspace-scoped conversation/context needed for the demo and expire it. |
| Calculation correctness | First implementation milestone and a release blocker. |
| Supplier/RAG | Use structured supplier records plus cited document retrieval. Start with PostgreSQL full-text search; add vectors only if evaluation proves a material benefit. |
| Google Drive | Not part of the initial public finish line. It may be used to source test documents during development. A later read-only “import selected file” experiment is acceptable after local ingestion is stable. |
| GraphQL/NestJS/microservices | Explicitly out of scope. |
| Billing | Out of scope. Protect costs with quotas, rate limits, retention limits, and a demo access gate. |

## Target architecture

```text
Vercel
└── Next.js application
    ├── marketing page
    ├── demo access
    └── authenticated workspace UI
             │
             ▼
Render
└── FastAPI modular monolith
    ├── workspace/session module
    ├── ingestion module
    ├── emissions domain
    ├── supplier/evidence module
    ├── scenario/report module
    └── optional assistant adapter
             │
             ▼
PostgreSQL
├── workspaces and quotas
├── shipments and calculation runs
├── suppliers and structured attributes
├── documents, chunks, and citations
└── scenarios and report snapshots
```

No Redis, message broker, dedicated embedder, Chroma service, MongoDB, GraphQL
gateway, or auth microservice is required for the prototype.

For initial document retrieval:

- extract text during a bounded upload request;
- store normalized text chunks and document metadata;
- use PostgreSQL full-text search and structured filters;
- retain the original file only temporarily unless a later requirement proves
  it is necessary;
- keep an optional retrieval interface so vector search can be evaluated later.

## Cost and usage envelope

The total recurring infrastructure target is at most $30 USD/month.

Preferred shape:

- Vercel frontend: free tier.
- One Render web service for FastAPI.
- One small managed PostgreSQL database, preferably on the same provider.
- No always-on embedding service.
- No paid object storage for the initial bounded demo.
- No mandatory paid LLM API.

Public demo limits:

- Maximum 500 shipment rows per CSV.
- Maximum 3 uploaded evidence documents per workspace.
- Maximum 10 MB per file.
- Text-based documents only.
- Maximum 10 analysis/scenario runs per workspace per day.
- Maximum 3 optional assistant requests per workspace per day when enabled.
- Workspace and extracted document retention of 24 hours by default.
- Hard server-side timeouts and upload limits.

If the selected Render plan and database cannot stay under the ceiling, the
deployment design must be simplified before adding features.

## Delivery phases

### Phase 0 — Establish a trustworthy baseline

Deliverables:

- [x] Remove abandoned migration artifacts and zero-byte placeholders.
- [x] Rotate exposed deploy hooks and audit secrets.
- [x] Reduce and pin dependencies.
- [x] Make local startup reproducible from documented commands.
- [x] Define environment variables with checked-in example files.
- [x] Add linting, formatting, type checking, and a minimal CI workflow.
- [x] Replace stale README claims with an honest implemented/roadmap split.
- [x] Align architecture, retrieval, and assistant messaging with the rebuild.

Current external action:

- On August 5, 2026, the user confirmed that the Render API key was rotated,
  the affected Render service no longer exists, and the historical deploy-hook
  references are disabled. No Render deployment workflow is present in `dev`.
  Deployment automation must remain disabled until a future service is
  intentionally configured with newly managed credentials.
- A repository-history pattern audit on June 19, 2026 found secret-shaped
  matches only in the historical `.github/workflows/deploy.yml`; no additional
  credential file or key pattern was identified.

Verification:

- A clean clone starts with one documented workflow.
- CI runs without real provider credentials.
- Secret scanning finds no active credentials.
- Frontend type check and backend test collection pass.

Verified baseline evidence:

- Commit `8b6d324` passed the GitHub Actions `repository`, `backend`, and
  `frontend` jobs on June 19, 2026, including a credential-free clean install,
  backend tests, frontend production build, and production dependency audit.
- A clean local clone of the same baseline built and started through Docker
  Compose without local environment override files; frontend, dashboard, and
  backend health requests returned successfully.
- Commit `0b72100` passed GitHub Actions run `31031689176` on August 5, 2026;
  the `repository`, `backend`, and `frontend` jobs all succeeded. The frontend
  production dependency audit reported zero vulnerabilities after the audited
  Axios, Next.js, PostCSS, and Sharp upgrades.

Exit gate:

> A contributor can clone, configure, run, and test the baseline without
> reverse-engineering old migration work.

### Phase 1 — Build the deterministic calculation core

Deliverables:

- Create framework-independent unit, distance, factor, and emissions modules.
- Define supported freight modes and normalized units.
- Version factor records with source, geography, year, and applicability.
- Separate route distance from straight-line fallback distance.
- Return a stable calculation result schema with warnings and provenance.
- Fix cache identity or avoid caching until correctness is proven.
- Build fixture-based tests for conversions, factors, fallbacks, repeated
  calculations, and comparison ordering.

Initial implementation evidence:

- Commit `8f71073` adds the framework-independent `domain/emissions` package
  with canonical modes, unit normalization, versioned factor records, route
  versus straight-line distance provenance, stable result serialization, and
  deterministic comparison ordering.
- The backend suite now has 27 passing tests, including golden formulas,
  invalid inputs, factor metadata, fallback warnings, repeated calculations,
  and unit-identity collision coverage.
- Commit `a70bdf0` exposes typed `/emissions/calculate` and
  `/emissions/compare` endpoints that return the same provenance-rich schema
  without invoking the optional assistant.
- The factor schedule is explicitly illustrative and carries a warning to
  replace it with an authoritative licensed source before public carbon
  accounting use.

Verification:

- No calculation unit test calls a network.
- Golden examples reproduce expected formulas and units.
- Every displayed result includes factor source and assumptions.
- Repeated calculations are identical and cannot collide across units.

Exit gate:

> The calculator can be trusted and demonstrated without an LLM or external
> emissions API.

Exit-gate evidence:

- Commit `072b61d` passed GitHub Actions run `31032999153` on August 5, 2026;
  the `repository`, `backend`, and `frontend` jobs all succeeded.
- The deterministic API contract tests demonstrate calculation and comparison
  without provider credentials, including factor provenance, assumptions, and
  straight-line distance warnings.

### Phase 2 — Add isolated demo workspaces and the portal

Deliverables:

- Create `/login` as a demo-access page.
- Issue a signed, HTTP-only session tied to one expiring workspace.
- Enforce workspace ownership in every data query.
- Build the portal shell and navigation.
- Add quota and retention records.
- Remove global LangChain memory and global user-specific caches.

Initial implementation evidence:

- The signed session module under `domain/workspaces` issues a unique
  workspace id, expiry, retention policy, and bounded quota records in an
  HMAC-protected claim. It has no process-global conversation memory or
  user-specific cache.
- `POST /demo/session`, `GET /demo/session`, and `DELETE /demo/session` manage
  the HTTP-only session cookie. `/emissions/*` now requires the workspace
  dependency, so direct calls without a valid session fail with `401`.
- The Next.js `/login` page creates a demo session and `/dashboard` verifies the
  cookie before rendering the portal navigation and current quota/retention
  claims.
- Backend tests cover signature tampering, expiry, unique workspace sessions,
  logout, direct API rejection, and two-client isolation. Frontend typecheck,
  lint, formatting, and the Webpack production build pass.
- The `persistence` package adds a checked-in PostgreSQL migration for
  workspace, quota, retention, and revocation records. The repository applies
  migrations idempotently, atomically increments daily analysis quotas, purges
  expired workspaces, and rejects revoked sessions. The CI backend job runs
  against a disposable PostgreSQL service; the full suite passes locally with
  both the development fallback and a temporary PostgreSQL server.
- Commit `3fb8b49` passed GitHub Actions run `31034311577` on August 5, 2026;
  the `repository`, `backend`, and `frontend` jobs all succeeded.

Scope boundary for this slice:

- The in-memory adapter is only a native-development fallback. The public
  deployment path requires `DATABASE_URL` and the PostgreSQL adapter.
- Browser-level isolation against a running frontend/API pair and the public
  deployment smoke gate remain outstanding before the Phase 2 exit gate.

Verification:

- Two browser sessions cannot read or mutate each other's records.
- Expired sessions are rejected and expired workspace data is removable.
- Direct API calls without a valid workspace session fail safely.

Exit gate:

> A public visitor can enter a controlled demo workspace with verified data
> isolation.

### Phase 3 — Implement shipment CSV ingestion

Deliverables:

- Publish a CSV template and schema documentation.
- Validate file size, MIME type, headers, row count, units, modes, locations,
  weights, and distances.
- Provide row-level errors without discarding valid rows.
- Normalize accepted rows and calculate a baseline analysis.
- Show a shipment table, totals, mode breakdown, hotspots, and quality warnings.

Initial implementation evidence:

- `domain/shipments` implements bounded UTF-8 CSV parsing, schema/header checks,
  MIME and filename checks, row limits, finite positive numeric validation,
  unit/mode normalization, hostile-content rejection, and row-level errors.
- `POST /shipments/upload` stores accepted normalized rows under the active
  workspace and returns deterministic totals, mode breakdowns, hotspots, factor
  metadata, assumptions, and warnings. `GET /shipments` reads only that
  workspace's rows.
- The protected portal now provides the CSV upload, normalized table, totals,
  mode breakdown, hotspots, and data-quality issue display. The template and
  schema are documented in `docs/shipment-csv.md`.
- Backend fixtures cover valid, partial, invalid, oversized, hostile, and
  workspace-isolated uploads; both the development fallback and PostgreSQL
  repository suites pass.

Verification:

- Fixture tests cover valid, partially valid, invalid, oversized, and hostile
  CSV inputs.
- The sample file completes ingestion and analysis within the public timeout.
- No raw upload content appears in logs.

Exit gate:

> A user can upload a realistic shipment file and understand both its emissions
> result and its data-quality limitations.

### Phase 4 — Implement supplier evidence ingestion and retrieval

Deliverables:

- Model suppliers separately from evidence documents.
- Upload text-based PDF and optionally DOCX/TXT.
- Extract bounded text with page/section location metadata.
- Store chunks, source metadata, extraction status, and timestamps.
- Search with structured supplier filters plus PostgreSQL full-text retrieval.
- Render supplier cards and evidence excerpts with citations.
- Rank only on explicit, visible criteria; preserve missing values.

Verification:

- Ingestion fixtures produce stable chunks and recoverable citations.
- Search evaluation contains representative questions and expected evidence.
- Every supplier claim shown in the UI is marked as structured, document-backed,
  user-provided, or missing.
- The system never silently treats the old synthetic supplier JSON as real.

Exit gate:

> A user can upload real supplier evidence and retrieve the exact supporting
> text behind a displayed claim.

### Phase 5 — Add scenarios, visualizations, and reports

Deliverables:

- Compare baseline and alternative freight modes or supplier choices.
- Add three focused charts with accessible table equivalents.
- Add explicit quick actions for common scenario operations.
- Build a report preview containing methodology, inputs, sources, results,
  warnings, and scenario deltas.
- Support print-to-PDF and CSV export.
- Show processing time and evidence completeness.

Verification:

- Scenario totals reconcile with the calculation engine.
- Charts and report values come from the same typed result payload.
- Exported data matches the displayed workspace state.
- Keyboard and responsive checks pass for the primary workflow.

Exit gate:

> The prototype produces a decision artifact suitable for a portfolio
> walkthrough, not merely a chatbot transcript.

### Phase 6 — Optional assistant, deployment, and demo hardening

Deliverables:

- Add an optional assistant adapter over stable application commands.
- Constrain the assistant to workspace-scoped retrieval and typed tools.
- Make the assistant unavailable gracefully when no provider is configured.
- Add rate limits, timeouts, sanitized structured logs, and error tracking
  appropriate to the budget.
- Add deployed health checks and one end-to-end primary-journey test.
- Prepare sample CSV and evidence documents with clear licensing/provenance.
- Rewrite the public site around what the product actually demonstrates.

Verification:

- The primary journey passes with the assistant disabled.
- When enabled, the assistant cannot access another workspace.
- The deployment survives malformed uploads and provider failures.
- Frontend, API, database, ingestion, and report smoke checks pass online.
- Monthly service configuration remains within the cost ceiling.

Exit gate:

> A reviewer can open the public site, complete the five-minute demo, inspect
> sources and assumptions, export the result, and understand the project's
> technical decisions without developer intervention.

## Optional post-finish experiments

Only after Phase 6:

- Read-only Google Drive import of explicitly selected files.
- Vector retrieval evaluated against the full-text retrieval test set.
- Production OAuth or passwordless identity.
- Longer-lived organizations and user accounts.
- Background ingestion jobs for larger documents.
- Additional Scope 3 categories.

These are experiments, not implied commitments.

## Explicit non-goals

- Production-grade carbon accounting or regulatory filing.
- Automated verification of certification authenticity.
- OCR or scanned-document extraction.
- General-purpose ESG chatbot.
- Autonomous procurement decisions.
- Real-time carrier pricing.
- Billing and subscriptions.
- Enterprise RBAC, SSO, SCIM, or audit exports.
- GraphQL federation or service decomposition.

## Goal operating policy

The Codex Goal should remain active across implementation turns, but each phase
has its own auditable exit gate. Work should proceed one gate at a time.

Between iterations:

1. Inspect the current phase's evidence.
2. Choose the smallest change that moves its exit gate.
3. Run the narrow relevant checks.
4. Record material scope or architecture decisions in this roadmap.
5. Do not mark the persistent objective complete until the public end-to-end
   finish line passes.

If a phase cannot be completed within the cost ceiling or repository boundary,
stop with:

- attempted approaches;
- evidence collected;
- the exact blocker;
- the least-expensive decision that would unblock progress.

## Portfolio-ready release checklist

- [ ] Public frontend is reachable.
- [ ] API and database health checks pass.
- [ ] Demo access and workspace isolation pass.
- [ ] Sample CSV ingestion passes.
- [ ] Real evidence document ingestion passes.
- [ ] Calculations expose versioned sources and assumptions.
- [ ] Supplier cards expose evidence and missing data.
- [ ] Scenario charts reconcile with calculations.
- [ ] Report export matches the UI.
- [ ] Assistant-off workflow passes.
- [ ] End-to-end browser test passes against production.
- [ ] Secrets and uploaded content are absent from Git and logs.
- [ ] README accurately distinguishes implemented features from future work.
- [ ] Monthly deployment configuration is at or below $30 USD.
