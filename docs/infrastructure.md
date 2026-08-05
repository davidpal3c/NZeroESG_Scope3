# NZeroESG Infrastructure

## Cost and service boundary

The public prototype is designed to remain at or below $30 USD per month beyond
existing ChatGPT/Codex access:

```mermaid
flowchart LR
    A[Browser] --> B[Next.js on Vercel free tier]
    B --> C[FastAPI on one Render web service]
    C --> D[Small managed PostgreSQL database]
    C -. optional .-> E[OpenAI or OpenRouter provider]
```

The assistant provider is optional. The primary shipment, evidence, scenario,
and report workflow must work without it.

No Redis, message broker, MongoDB, Chroma, dedicated embedding service,
background worker, or paid object storage is required for the initial public
demo.

## Local baseline

The credential-free local stack contains a frontend, API, and PostgreSQL
database:

```text
localhost:3000  Next.js frontend
       │
       ▼
localhost:8000  FastAPI backend
       │
       ▼
local PostgreSQL   workspace/quota records
```

Start it with:

```bash
docker compose up --build
```

Compose applies the checked-in workspace migration and uses PostgreSQL for
session-backed workspace records. Native development without `DATABASE_URL`
uses the explicitly documented in-memory adapter; production must configure a
managed PostgreSQL URL.

The Compose configuration intentionally sets `ASSISTANT_ENABLED=false`. This
keeps the baseline reproducible without provider credentials and verifies that
the product does not depend on a paid model API.

Health endpoints:

- frontend: `GET http://localhost:3000/`
- backend: `GET http://localhost:8000/health`
- assistant status: `GET http://localhost:8000/chat/health`

The backend health check gates frontend startup in Compose.

## Target deployment

The checked-in [`render.yaml`](../render.yaml) is the deployment handoff for
the API. It intentionally uses the `dev` branch, waits for CI checks to pass,
generates the session secret in Render, and references the managed database
without embedding credentials. Create or review the Blueprint in the Render
Dashboard; this repository does not contain a deploy hook or provider token.

### Frontend

- Vercel free tier;
- build from `nzeroesg-client`;
- configure `NEXT_PUBLIC_BACKEND_URL` with the public FastAPI origin;
- no server-side user data stored in the frontend deployment.

### Backend

- one Render web service built from `nzeroesg-api`;
- expose the FastAPI service and health endpoint;
- allow CORS only from the deployed frontend and documented local origins;
- keep the optional assistant disabled unless a provider and quota policy are
  explicitly configured.

### Database

- one small managed PostgreSQL database, preferably colocated with the backend;
- migrations are required for schema changes;
- every user-owned record carries a workspace identifier;
- demo workspaces and extracted evidence expire after 24 hours by default.

The current Render pricing payload lists the durable `basic-1gb` Postgres tier
at $19/month; paired with a free web service and the existing free Vercel
frontend, the planned recurring baseline remains below $30/month. Render's
free Postgres tier is intentionally not selected because it expires after 30
days. Confirm the actual workspace invoice before treating this as a final
cost gate.

## Data and upload limits

The backend must enforce the public limits from the roadmap:

- 500 shipment rows per CSV (enforced by the upload parser);
- 3 evidence documents per workspace;
- 10 MB per file (enforced before parsing);
- text-based evidence only;
- 10 analysis or scenario runs per workspace per day (enforced server-side);
- 3 assistant requests per workspace per day when enabled.

Original evidence files should be temporary in the initial bounded demo.
Normalized text, metadata, and citations live in PostgreSQL until workspace
expiry.

## Deployment safety

Historical Render deploy hooks were committed in an earlier workflow. On
August 5, 2026, the user confirmed that the Render API key was rotated, the
affected Render service no longer exists, and the historical hook references
are disabled. No Render deployment workflow is currently tracked. If a future
backend service is created, deployment configuration must use newly managed
repository or provider-managed secrets and must not restore historical hook
credentials.

CI must remain credential-free and run:

- repository secret-pattern checks;
- backend lint, formatting, and tests;
- frontend type checking, lint, formatting, and production build;
- production dependency audit.
- the local browser smoke suite against disposable PostgreSQL, covering the
  primary demo journey and workspace isolation.

The browser suite is a local/CI gate; it does not substitute for the public
deployment smoke check. The current Vercel URL still serves the historical
`main` branch, and the Render backend service no longer exists, so online
verification remains outstanding.

Public verification snapshot from August 5, 2026:

- `https://n-zero-esg-scope3.vercel.app/` responds with `200`.
- `/login` responds with `404`, and the public-target Playwright suite cannot
  find the current “Enter a private workspace” page.
- The repository's current rebuilt portal and `render.yaml` are on `dev`; the
  public domain has not yet been pointed at that branch or given a live API
  origin.
