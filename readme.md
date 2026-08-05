# NZeroESG Scope 3

NZeroESG is being rebuilt as a lean, portfolio-ready prototype for traceable
freight-emissions analysis and supplier evidence.

The intended demo workflow is:

1. Enter an isolated, expiring demo workspace.
2. Upload shipment CSV data.
3. Upload real supplier or compliance evidence.
4. Review deterministic emissions calculations and source-backed supplier
   facts.
5. Compare scenarios, inspect charts, and export a decision report.

The finish line and phased acceptance criteria are documented in
[docs/demo-roadmap.md](docs/demo-roadmap.md). Human and agent contributors must
also follow [AGENTS.md](AGENTS.md).

## Current status

The `dev` branch is an active rebuild from the historical pre-GraphQL prototype
at commit `4eed03c`.

Implemented in the current baseline:

- Next.js marketing interface and optional chat UI.
- FastAPI health and chat endpoints.
- Framework-independent deterministic freight-emissions core with versioned
  factor provenance and explicit distance warnings.
- Typed `/emissions/calculate` and `/emissions/compare` API endpoints.
- Signed, expiring demo sessions at `/demo/session`, with HTTP-only cookies,
  workspace-specific quota/retention claims, and a protected portal shell at
  `/login` and `/dashboard`.
- PostgreSQL workspace persistence with migrations, server-side analysis
  quotas, revocation, and expiry cleanup when `DATABASE_URL` is configured.
- Shipment CSV ingestion with bounded validation, row-level errors,
  workspace-scoped normalized records, totals, mode breakdowns, hotspots, and
  factor/data-quality warnings. See [the CSV schema](docs/shipment-csv.md).
- Supplier evidence ingestion for UTF-8 TXT and text-based PDF files, structured
  supplier cards, PostgreSQL full-text search, and recoverable chunk/page
  citations.
- Deterministic shipment-mode scenarios, accessible comparison tables and
  visual bars, printable report views, and authenticated CSV report export.
- Offline freight-factor fallback calculations for the legacy assistant.
- Optional OpenAI or OpenRouter assistant integration, disabled by default.
- Playwright browser smoke coverage for the local five-minute workflow,
  report download, logout, and workspace isolation.
- Reproducible Docker definitions and credential-free CI checks.

Not implemented yet:

- A production-ready public demo.

The old synthetic supplier dataset, Chroma service, and dedicated embedding
service were removed from `dev`; they were demonstration plumbing rather than a
defensible supplier-evidence system.

When `DATABASE_URL` is absent, native development uses an explicit in-memory
adapter for convenience. Docker Compose and production use the PostgreSQL
adapter, which applies checked-in migrations and stores workspace, quota,
retention, revocation, supplier, document, and evidence-chunk records
server-side. Production startup fails closed when `DATABASE_URL` is missing.

## Local development

### Docker

The default stack has no paid API dependency:

```bash
docker compose up --build
```

- Frontend: <http://localhost:3000>
- API health: <http://localhost:8000/health>
- API documentation: <http://localhost:8000/docs>

The optional assistant is disabled in this configuration. The health endpoint
and future deterministic product workflows do not require provider credentials.

### Native tools

Requirements:

- Python 3.12.10
- Node.js 20.19.0
- npm

```bash
make setup
make check
```

Run the services separately:

```bash
cd nzeroesg-api
../.venv/bin/uvicorn main:app --reload
```

```bash
cd nzeroesg-client
npm run dev
```

Copy the checked-in examples when local environment overrides are needed:

```bash
cp nzeroesg-api/.env.example nzeroesg-api/.env
cp nzeroesg-client/.env.example nzeroesg-client/.env.local
```

## Optional assistant

The assistant is not required for the core product. To test it, set:

```dotenv
ASSISTANT_ENABLED=true
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

OpenRouter can be selected with `LLM_PROVIDER=openrouter` and the corresponding
environment variables from `nzeroesg-api/.env.example`.

Do not commit credentials. Assistant requests remain stateless until the
workspace-scoped assistant workflow is implemented.

## Quality checks

Backend:

```bash
cd nzeroesg-api
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
../.venv/bin/pytest
```

Frontend:

```bash
cd nzeroesg-client
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Browser smoke suite:

```bash
cd nzeroesg-client
npx playwright install chromium
npm run test:e2e
```

The suite starts the native API and frontend automatically. Set
`E2E_DATABASE_URL` to exercise the PostgreSQL adapter instead of the native
development fallback.

The API deployment handoff is the checked-in [`render.yaml`](render.yaml)
Blueprint. It contains no provider credentials; Render generates the session
secret and supplies the database connection string.

CI runs these checks without external provider credentials or network calls
from tests. The local secret check scans tracked and non-ignored new files for
common credential and deploy-hook patterns; CI also audits production npm
dependencies.

## Architecture direction

The target is a modular monolith:

```text
Next.js
   │
FastAPI
   │
PostgreSQL
```

GraphQL, NestJS, Redis, MongoDB, Chroma, a message broker, and a dedicated
embedding service are out of scope until measured requirements justify them.

## Security note

Historical Render deploy hooks were committed in an earlier workflow. The
workflow has been removed from `dev`; the affected Render service no longer
exists and the user has confirmed the Render API key was rotated. Deployment
automation remains disabled until a future backend service is intentionally
configured with newly managed credentials.

## License

See [LICENSE.md](LICENSE.md).
