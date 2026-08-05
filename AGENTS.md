# NZeroESG Engineering Contract

This repository is being rebuilt as a lean, portfolio-ready prototype for
Scope 3 freight analysis and supplier evidence. The product roadmap and release
gates live in `docs/demo-roadmap.md`.

## Product boundary

- Optimize for one excellent demo workflow before adding breadth.
- Keep the core product useful without an LLM. Calculations, filtering,
  ingestion, citations, and reports must be deterministic.
- Treat the LLM as an optional explanation and orchestration layer, never as
  the source of truth for emissions values or supplier facts.
- Do not present fixture, generated, or unverified supplier data as real.
- Do not add billing, marketplace, multi-region, enterprise administration, or
  broad ESG reporting until the demo-readiness finish line is met.

## Architecture

- Use a modular monolith: Next.js frontend, FastAPI backend, and PostgreSQL.
- Do not add GraphQL, NestJS, Redis, MongoDB, Celery, Kafka, or a new deployable
  service without a measured need and explicit approval.
- Keep domain logic independent from FastAPI, LangChain, databases, and model
  providers.
- Prefer structured SQL queries for supplier attributes and full-text
  retrieval for evidence documents. Vector search is optional, not a default.
- Keep provider integrations behind small interfaces so they can be replaced
  or disabled.
- Every user-owned record must carry a workspace identifier. Never rely on
  process-global conversation memory or caches for user state.

## Code quality

- Prefer small, typed modules with one clear responsibility.
- Use Pydantic schemas at API boundaries and explicit domain types internally.
- Return stable response envelopes; do not make the frontend depend on raw
  LangChain or provider response shapes.
- Remove dead code rather than leaving large commented implementations.
- Avoid placeholder files and speculative abstractions.
- Pin production dependencies and container image versions.
- Add a dependency only when the standard library or an existing dependency
  cannot reasonably solve the problem.
- Database changes require migrations.

## Calculation and evidence rules

- Normalize units before creating cache keys or performing calculations.
- Store the factor value, factor unit, source, version/date, assumptions, and
  calculation formula with every result.
- Distinguish measured, supplier-provided, estimated, and fallback values.
- Never label an LLM-generated score as confidence. Use evidence completeness,
  data quality, and explicit warning states instead.
- Supplier recommendations must expose the filters, weights, and evidence that
  produced the ranking.
- Citations must point to an ingested document and a recoverable text location.

## Testing

- Unit tests must not call external networks.
- Mock provider boundaries, not domain logic.
- Each calculation bug requires a regression test.
- Each API contract change requires backend schema tests and a frontend type
  update.
- Maintain at least:
  - domain unit tests,
  - API/integration tests against a disposable database,
  - ingestion fixture tests,
  - one browser end-to-end test for the primary demo journey,
  - deployed smoke tests for frontend and backend health.
- A feature is not complete while its happy path exists only in manual testing.

## Security and privacy

- Never commit credentials, deploy hooks, tokens, uploaded documents, or local
  databases.
- Validate upload type, size, row count, and parsed content.
- Do not support OCR, macros, executable attachments, or archive extraction in
  the initial prototype.
- Sanitize logs. Do not log document contents, access tokens, or complete user
  prompts by default.
- Demo workspaces must be isolated and automatically expire.
- Use server-side rate and quota checks for all expensive operations.

## Cost discipline

- The public prototype must remain within the monthly ceiling documented in
  the roadmap.
- The core demo must not require paid OpenAI API usage. Optional LLM features
  must degrade gracefully when disabled or out of budget.
- Prefer Vercel's free frontend tier and the minimum Render services needed for
  the backend and database.
- Do not add infrastructure because it may be useful later.

## Working method

- Keep commits focused and explain user-visible behavior in the commit message.
- Inspect existing changes before staging; never stage unrelated local files.
- Run the narrowest relevant checks while iterating and the roadmap phase gate
  before declaring a milestone complete.
- Update `docs/demo-roadmap.md` when scope, acceptance criteria, or cost
  assumptions materially change.
- Stop and ask before introducing a paid service, a new deployable service, a
  destructive migration, or a material change to the product finish line.

## Definition of done

A change is done only when its behavior is implemented, tested, documented
where necessary, safe for isolated demo workspaces, and compatible with the
cost ceiling. A milestone is done only when its explicit roadmap exit gate
passes.
