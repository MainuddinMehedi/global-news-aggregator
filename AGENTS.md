# AGENTS.md — Global News Aggregator

## Quick Reference

**Root commands:**
- `npm run ingest` — Main pipeline (RSS fetch → dedup → AI enrich → revalidate)
- `npm run ingest:raw` — RSS fetch + dedup only (skip AI)
- `npm run backlog` — Process unenriched articles (default 100, `--limit=N`)
- `npm run scan-topics` — Run Locked Topic scanners (all active, or `--topic-id=UUID`)
- `npm run cluster` — Story clustering pass

**Frontend (in `frontend/`):**
- `npm run dev` — Next.js 16 dev server
- `npm run build` — Production build
- `npm run lint` — ESLint (no typecheck script)

## Architecture

- **Monorepo**: `global-news-aggregator/` (root) + `frontend/` (Next.js 16) + `shared/prisma-client` (generated)
- **Prisma schema**: `prisma/schema.prisma` → outputs to `../shared/prisma-client`
- **Ingestion service**: `ingestion-service/` — Node.js ESM, self-contained Prisma client in `db/prisma.js`
- **AI providers**: Groq (primary), Mistral, Gemini (topic summaries) — rate-limited via sliding window in `ai/rateLimiter.js`
- **Deduplication**: 1) normalized URL unique constraint, 2) SHA-256 content hash fallback
- **Revalidation**: Tags (`articles`, `stories`, `locked-topics`, `story-{slug}`, `locked-topic-{id}`) via `revalidateCache.js`

## Scheduled Workflows (GitHub Actions)

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `ingest.yml` | `*/30 * * * *` | Main RSS ingestion + AI enrichment |
| `cluster.yml` | `45 * * * *` | Story clustering (staggered from ingest) |
| `backlog.yml` | `0 3 * * *` | Daily backlog of unprocessed articles |
| `locked-topics.yml` | `15 */2 * * *` | Surveillance scanning for Locked Topics |

All workflows: `node-version: "25"`, `npx prisma generate`, inject secrets + vars.

## Key Conventions

- **ESM only** — `"type": "module"` in root package.json
- **No test suite** — `npm test` exits 1; verify manually or via workflow runs
- **Frontend uses Prisma via `@news/db`** (workspace dependency)
- **Env loading**: Root `.env` → `frontend/.env.local` (copy manually)
- **DB**: Supabase (PostgreSQL) via `DATABASE_URL`
- **AI config via env vars**: See workflow files for full list (`AI_GROQ_*`, `AI_MISTRAL_*`, `AI_TOKEN_MULTIPLIER`, etc.)

## Common Gotchas

- Prisma client generated to `shared/prisma-client` — run `npx prisma generate` after schema changes
- Ingestion uses `--skip-ai` or `--ai-limit=N` flags; clustering/topic scanners have no CLI flags
- Revalidation secret (`REVALIDATE_SECRET`) required for cache invalidation
- Next.js 16: Server Components default, wrap dynamic bits in `<Suspense>`, use `"use cache"` granularly
- Locked Topic scanners need `BRAVE_API_KEY`, `GITHUB_TOKEN`, `GEMINI_API_KEY` for full coverage