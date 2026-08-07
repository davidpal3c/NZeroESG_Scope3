# 🌱 CarbonSage (formerly NZeroESG)

### Evidence-grounded Scope 3 intelligence, wherever decisions happen.

CarbonSage is an embeddable ESG decision agent for freight and supplier
workflows. It brings shipment data, supplier evidence, deterministic emissions
tools, and conversational analysis into one traceable experience.

The initial thesis is deliberately specific:

> An embeddable ESG decision agent demonstrating hybrid RAG, semantic
> retrieval, typed tool orchestration, cited responses, and interactive data visualizations.

The goal is not to build an entire carbon-accounting SaaS. CarbonSage uses just
enough product structure—isolated workspaces, artifact management, an agent
playground, and a secure embed surface—to prove that the AI system works in a
credible application.

## Why this project exists

Procurement and logistics teams often have the information they need, but it is
scattered across shipment files, supplier PDFs, spreadsheets, and existing
operational systems. CarbonSage explores a practical question: can an agent
retrieve the right evidence, invoke trusted calculation tools, explain the
trade-off, and return a decision-ready result without becoming the source of
truth itself?

That means deterministic code still owns calculations, scenario data, source
locations, and report values. The agent is responsible for finding context,
choosing typed tools, and explaining validated results.

## Try the current demo

The trusted deterministic baseline is live at:

<https://n-zero-esg-scope3.vercel.app/>

The intended path is short:

1. Enter an isolated, expiring demo workspace.
2. Upload shipment data, or use
   [`docs/examples/shipments.csv`](docs/examples/shipments.csv).
3. Add supplier or compliance evidence.
4. Review totals, freight modes, hotspots, warnings, and cited supplier facts.
5. Compare a lower-emission scenario and export the report.

The API health endpoint is:

- <https://nzeroesg-api.onrender.com/health>

The current public workflow does not require an LLM. The existing assistant is
disabled in production while it is replaced by the workspace-scoped,
evidence-grounded CarbonSage agent described in the roadmap.

## What works today

- Deterministic freight-emissions calculations with versioned factor
  provenance, assumptions, and distance warnings.
- Signed, expiring demo workspaces with HTTP-only sessions, quotas, retention,
  revocation, and workspace-isolated persistence.
- Shipment CSV ingestion with bounded validation, row-level errors, normalized
  records, mode breakdowns, hotspots, and quality warnings.
- Text and text-based PDF evidence ingestion with structured supplier records,
  PostgreSQL full-text retrieval, and recoverable page/chunk citations.
- Scenario comparisons, accessible chart alternatives, printable report
  previews, and authenticated CSV export.
- A Vercel client, Render API, Neon PostgreSQL database, and credential-free CI
  and browser checks.

## Upcoming changes:

CarbonSage will build on that baseline in a controlled order:

1. A small workspace artifact catalog with CRUD and provenance.
2. Hybrid retrieval combining PostgreSQL full-text search with pgvector-backed
   semantic search. Evaluation will tune fusion and query routing, not decide
   whether vector search is implemented.
3. Typed, workspace-scoped tools for evidence search, emissions calculations,
   scenario comparison, and reports.
4. A versioned response protocol for text, metrics, tables, charts, citations,
   warnings, artifact references, and confirmed actions.
5. A dashboard agent playground using the same runtime and renderer as the
   embedded experience.
6. A framework-independent JavaScript loader and authenticated iframe.
7. One explicit, read-only Google Drive selected-file import.
8. Optionally, a read-only MCP adapter over the same stable application tools.

Dropbox, billing, organization administration, background synchronization,
enterprise RBAC, and a family of framework-specific SDKs are intentionally
deferred for now. One excellent vertical slice is more valuable here than broad SaaS
surface area.

## Architecture

CarbonSage remains a lean modular monolith:

```text
Control plane / dashboard ── workspace session ──┐
JavaScript host ── loader + iframe ── embed token ──┼─→ FastAPI agent runtime
Google Drive ── selected-file import ── artifact ──┘          │
                                                        ├─→ typed tools
                                                        ├─→ hybrid retrieval
                                                        └─→ Neon PostgreSQL
```

No Redis, message broker, dedicated vector database, background worker, or
agent microservice is required. pgvector is the required semantic-search layer
inside the existing PostgreSQL retrieval path, not a new service.

The former NZeroESG retrieval prototype used ChromaDB as its standalone vector
database. CarbonSage retains that history while consolidating lexical records,
embeddings, workspace isolation, and citations in PostgreSQL.

The detailed decisions and delivery gates live in:

- [`docs/demo-roadmap.md`](docs/demo-roadmap.md)
- [`docs/app.architecture.md`](docs/app.architecture.md)
- [`docs/langchain.rag.workflow.md`](docs/langchain.rag.workflow.md)

## Stack

| Part | Role |
| --- | --- |
| Next.js and React | Public site, control plane, agent playground, embed UI, and structured renderers |
| FastAPI | Sessions, artifacts, retrieval, typed tools, conversations, and reports |
| Neon PostgreSQL | Workspace data, evidence, full-text search, and evaluated vector retrieval |
| LangChain | Optional orchestration adapter, not domain logic or source of truth |
| Vercel | Public client deployment from `main` |
| Render | FastAPI deployment using the existing service configuration |
| Docker and GitHub Actions | Reproducible local setup and automated checks |

## Run locally

You will need Python 3.12.10, Node.js 20.19.0 or newer, npm, and Docker for the
full local stack.

### Docker

```bash
docker compose up --build
```

Then open:

- Frontend: <http://localhost:3000>
- API health: <http://localhost:8000/health>
- API documentation: <http://localhost:8000/docs>

### Native tools

```bash
make setup
make check
```

Run the API and client in separate terminals:

```bash
cd nzeroesg-api
../.venv/bin/uvicorn main:app --reload
```

```bash
cd nzeroesg-client
npm run dev
```

For local environment overrides:

```bash
cp nzeroesg-api/.env.example nzeroesg-api/.env
cp nzeroesg-client/.env.example nzeroesg-client/.env.local
```

The historical directory, service, environment-variable, and public URL names
remain unchanged so the working deployment is not broken by the public rebrand.

## Optional model provider

The current assistant path is intentionally off in production. Local provider
experiments can be enabled in `nzeroesg-api/.env`:

```dotenv
ASSISTANT_ENABLED=true
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

OpenRouter is also supported. No provider credential is required for the
deterministic workflow, CI, or the primary public demo.

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
npm run test:e2e
```

CarbonSage is still a prototype, but it has a clear standard: AI-generated
guidance should be useful, inspectable, grounded in workspace evidence, and
easy to carry into the software where a decision is already being made.

Built by David P.

## License

See [`LICENSE.md`](LICENSE.md).
