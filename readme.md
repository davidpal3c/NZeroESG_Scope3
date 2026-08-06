# 🌱 NZeroESG — Scope 3

### A practical, traceable way to understand freight emissions and supplier evidence.

Procurement and logistics account for a large share of Scope 3 emissions, but the
information needed to act is often scattered across spreadsheets, shipment
files, supplier PDFs, and disconnected tools. I started NZeroESG to make that
work feel a little more concrete: bring the evidence together, show the
calculation, and make the trade-offs easier to discuss.

The original idea was an agentic AI assistant that could answer questions such
as:

- “What is the carbon footprint of a 100 kg shipment from Toronto to Vancouver by air?”
- “How would the result change if I used rail or truck instead?”
- “What supplier evidence supports this sustainability claim?”

The current public version takes a deliberately dependable first step. Its core
workflow is data-first and deterministic, so it remains useful without an LLM
or a paid API call. The optional assistant is still available for development,
but it is disabled in the public environment by default.

## Try the demo

The live demo is here:

<https://n-zero-esg-scope3.vercel.app/>

The intended path is short:

1. Enter an isolated, expiring demo workspace.
2. Upload shipment data, or start with the example in
   [`docs/examples/shipments.csv`](docs/examples/shipments.csv).
3. Add supplier or compliance evidence.
4. Review the emissions totals, modes, hotspots, warnings, and source-backed
   supplier facts.
5. Compare scenarios and export a report you can actually share.

The API is running separately on Render:

- <https://nzeroesg-api.onrender.com/health>

The phased finish line and acceptance criteria live in
[`docs/demo-roadmap.md`](docs/demo-roadmap.md). Contributors should also read
[`AGENTS.md`](AGENTS.md).

## What is working today

The rebuilt demo includes:

- A deterministic freight-emissions core with versioned factor provenance,
  explicit distance warnings, and typed calculation and comparison endpoints.
- Signed, expiring demo sessions with HTTP-only cookies, workspace-specific
  quotas, retention, revocation, and a protected `/login` and `/dashboard`
  portal.
- PostgreSQL persistence with checked-in migrations. Production uses the Neon
  PostgreSQL database configured through `DATABASE_URL`.
- Shipment CSV ingestion with bounded validation, row-level errors, normalized
  records, totals, mode breakdowns, hotspots, and data-quality warnings. The
  [CSV schema is documented here](docs/shipment-csv.md).
- Supplier evidence ingestion for UTF-8 text and text-based PDFs, structured
  supplier cards, PostgreSQL full-text search, and recoverable page/chunk
  citations.
- Scenario comparisons, accessible tables and visual bars, printable report
  views, and authenticated CSV report export.
- A public Vercel client, a Render API, security headers, exact-origin CORS,
  and credential-free CI checks.

## A note about the original agent idea

The first version of NZeroESG explored LangChain’s ReAct pattern, Chroma,
retrieval-augmented supplier search, and several external emissions services.
That was a useful exploration, but it also made the demo harder to defend and
more expensive to operate.

For the current baseline, I kept the parts that make the product trustworthy:
bounded inputs, explicit calculations, provenance, evidence citations, and
workspace isolation. The optional OpenAI/OpenRouter assistant can be enabled
intentionally for development, but it is not required for the core product and
does not run in the public demo.

## The stack, in plain language

| Part                      | Role                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| Next.js and React         | The public interface, portal, charts, and report views               |
| FastAPI                   | The API for sessions, shipments, evidence, calculations, and reports |
| Neon PostgreSQL           | Workspace, shipment, evidence, quota, and retention data             |
| Vercel                    | Public client deployment from `main`                                 |
| Render                    | API deployment, currently configured from the `dev` branch           |
| Docker and GitHub Actions | Reproducible local setup and automated checks                        |

The architecture is intentionally a modular monolith:

```text
Next.js → FastAPI → Neon PostgreSQL
```

GraphQL, Redis, MongoDB, Chroma, a message broker, and a dedicated embedding
service are not part of the current production path. They can be reconsidered
when measured requirements justify the additional operational cost.

## Run it locally

You will need Python 3.12.10, Node.js 20.19.0 or newer, npm, and Docker if you
want to run the full stack.

### Docker

```bash
docker compose up --build
```

Then open:

- Frontend: <http://localhost:3000>
- API health: <http://localhost:8000/health>
- API documentation: <http://localhost:8000/docs>

The default stack does not need a paid provider credential. The optional
assistant is disabled.

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

If you need local environment overrides, copy the examples first:

```bash
cp nzeroesg-api/.env.example nzeroesg-api/.env
cp nzeroesg-client/.env.example nzeroesg-client/.env.local
```

Those files are ignored by Git. Do not commit credentials.

## Optional assistant

The assistant is intentionally off in production. To experiment with it
locally, set the appropriate values in `nzeroesg-api/.env`:

```dotenv
ASSISTANT_ENABLED=true
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

OpenRouter is also supported with `LLM_PROVIDER=openrouter`; see
`nzeroesg-api/.env.example` for the provider-specific variables.

## Quality checks

Backend checks:

```bash
cd nzeroesg-api
../.venv/bin/ruff check .
../.venv/bin/ruff format --check .
../.venv/bin/pytest
```

Frontend checks:

```bash
cd nzeroesg-client
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:e2e
```

The browser suite starts the native API and frontend automatically. Set
`E2E_DATABASE_URL` when you want to exercise PostgreSQL instead of the native
development fallback.

## Where I would take it next

- Let users opt into the assistant explicitly, with clear cost and data-use
  boundaries.
- Add more evidence formats and stronger supplier-level review workflows.
- Extend scenario comparisons toward cost, delivery time, and emissions
  trade-offs.
- Add richer audit history and organization-level access controls once the
  demo’s workflow has been validated.

NZeroESG is still a prototype, but the goal is practical: make carbon-aware
procurement decisions easier to explain, easier to verify, and easier to act on.

Built by David P.

## License

See [`LICENSE.md`](LICENSE.md).
