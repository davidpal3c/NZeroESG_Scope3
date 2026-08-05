# NZeroESG Application Architecture

## Architecture decision

NZeroESG is a lean modular monolith:

```text
Vercel
└── Next.js frontend
    ├── marketing page
    ├── demo access
    └── workspace portal
             │
             ▼
Render
└── FastAPI backend
    ├── workspace and session module
    ├── shipment ingestion module
    ├── emissions domain
    ├── supplier and evidence module
    ├── scenario and report module
    └── optional assistant adapter
             │
             ▼
PostgreSQL
```

This replaces the historical agent-first design. GraphQL, Redis, MongoDB,
Chroma, a message broker, and a dedicated embedding service are not part of the
demo architecture.

## Source-of-truth boundaries

Deterministic application code owns:

- unit normalization and emissions calculations;
- factor selection, formulas, assumptions, and warnings;
- shipment validation and normalization;
- supplier filters and ranking inputs;
- document extraction, retrieval, and citations;
- scenario totals, charts, and report payloads.

The optional assistant may explain results or invoke stable application
commands. It is never the source of truth for an emissions value, supplier
claim, citation, or report.

## Backend module direction

The FastAPI application will remain one deployable service while keeping domain
boundaries explicit:

```text
nzeroesg-api/
├── api/             # HTTP schemas, routes, and session dependencies
├── domain/
│   ├── emissions/   # Units, modes, factors, distance, calculations
│   ├── shipments/   # Normalized shipment records and analysis
│   ├── suppliers/   # Structured supplier attributes
│   └── reports/     # Scenarios and report snapshots
├── persistence/     # Database models, repositories, and migrations
├── ingestion/       # Bounded CSV and text-document parsing
└── assistant/       # Optional adapter over typed application commands
```

The exact folders may evolve while the phase gates are implemented, but domain
logic must not depend on FastAPI, LangChain, a database session, or a model
provider.

## Primary request flows

### Shipment analysis

```text
CSV upload
  → server-side limits and schema validation
  → row-level validation and unit normalization
  → deterministic calculation core
  → workspace-scoped persistence
  → typed totals, breakdowns, hotspots, and warnings
  → dashboard and report
```

### Supplier evidence

```text
Text-based document upload
  → server-side file and content limits
  → bounded text extraction with page/section locations
  → normalized chunks and document metadata
  → PostgreSQL full-text search plus structured supplier filters
  → recoverable evidence citations
  → supplier cards and report
```

Vector retrieval may be evaluated after the public demo is complete, but only
against a retrieval test set that demonstrates a material improvement.

### Optional assistant

```text
Workspace-scoped question
  → quota and session checks
  → typed application command or cited retrieval
  → optional LLM explanation
  → stable response envelope with sources and processing time
```

The primary workflow must remain fully usable when this path is disabled.

## Workspace isolation

Every user-owned database record must include a workspace identifier. A signed,
HTTP-only session selects one expiring demo workspace, and every repository
query must enforce that workspace boundary. Process-global conversation memory
and user-specific caches are prohibited.

## Deployment and cost boundary

The intended public deployment uses:

- Vercel's free frontend tier;
- one Render FastAPI service;
- one small managed PostgreSQL database;
- no mandatory paid LLM API;
- no always-on embedding or background-worker service.

The complete recurring infrastructure must remain within the roadmap's
$30 USD monthly ceiling.

## Current implementation status

The current implementation includes the Next.js marketing interface, `/login`
and protected portal shell, FastAPI health and optional chat endpoints, signed
expiring demo workspace sessions, a migrated PostgreSQL workspace repository
with server-side quota, revocation, and retention enforcement, and a
framework-independent deterministic freight-emissions core under
`domain/emissions`. The core exposes normalized units, versioned illustrative
factors, distance provenance, warnings, and stable result serialization.
Shipment ingestion, evidence retrieval, scenarios, and reports remain roadmap
work and must not be represented as implemented.

The authoritative delivery sequence and acceptance gates are in
[`demo-roadmap.md`](demo-roadmap.md).
