# Locked Topics: Immediate Action Board

### 1. Foundation Cleanup
- [x] Audit and document the actual scanner flow: when sources run, when findings are aggregated, and where persistence happens.
- [x] Fix N+1 persistence: replace per-finding inserts with bulk persistence where possible.
- [x] Standardize scanner return contracts to one shape: `{ findings, metadata }`.
- [x] Centralize scanner config/constants: max results, relevance thresholds, timeouts, source defaults.
- [x] Add source type validation before dispatching scanners.
- [x] Fix `internalDb` where-clause mutation risk.
- [x] Remove `realtimeMatcher.js` if confirmed unused.

### 2. Source Types and Enums
- [x] Verify every scanner's `sourceType` against the Prisma enum and frontend filters.
- [x] Add or correct `YOUTUBE` source handling instead of mapping YouTube findings to `RSS`.
- [x] Check whether any other source types are missing, overloaded, or mapped into the wrong UI bucket.
- [x] Update source type labels/filtering in the frontend if needed.

### 3. Error Handling and Observability
- [x] Audit all scanners/scrapers for silent `catch` blocks or empty-array fallbacks.
- [x] Add logging where failures are currently swallowed.
- [x] Leave explicit TODO notes for future user/admin notifications where a failure should surface outside logs.
- [x] Add retry/backoff only where it is low-risk and local to external calls.

### 4. Relevance Improvements Without Vectors
- [x] Reuse the shared boolean query evaluator consistently across scanners and specialized scrapers.
- [x] Remove duplicated ad hoc query parsing where possible.
- [x] Add a deterministic prefilter before LLM scoring where it can reduce obvious noise without harming recall.
- [x] Keep this stage vector-free for now; pgvector/semantic matching belongs to v2 planning.

### 5. Basic Dedup Improvements Without Vectors
- [x] Centralize dedupe responsibility instead of scattering local URL dedupe in multiple scanners.
- [x] Keep exact URL uniqueness as the hard DB guard.
- [x] Add normalized URL/content-hash dedupe only if it can be done without forcing story-cluster schema decisions.
- [x] Defer simhash, entity fingerprints, variants, and clusters to v2 unless a very small isolated improvement is clearly safe.

### 6. Search Availability
- [x] Add DDG-first web search because Brave API is not available now.
- [x] Keep Brave as a future/premium fallback path rather than a required dependency.
- [x] Keep DDG implementation modest: enough to make search work, not a full adaptive source system yet.

### 7. Manual Scan Route Decision
- [x] Revisit `POST /api/locked-topics/[id]/scan` after scanner cleanup.
- [x] If manual scans are slow, timing out, or heavily used, move to async status/polling or a job queue.
- [x] Prefer `pg-boss` over Redis-based queues if a real queue is introduced, because the project already depends on Postgres/Supabase.
- [x] Do not let job queue work block the immediate scanner cleanup unless the current route is actively broken.
