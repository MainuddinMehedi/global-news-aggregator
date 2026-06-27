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
- **Notifications**: In-app + Discord/Telegram via pg-boss workers — see `docs/1. Domain specific/7. notification-system/`

## Scheduled Workers (pg-boss)

All background jobs run via **pg-boss** (defined in `ingestion-service/lib/boss.js`), not GitHub Actions.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `rss-ingestion` | `*/30 * * * *` | Main RSS ingestion + AI enrichment |
| `story-clustering` | `45 * * * *` | Story clustering (staggered from ingest) |
| `backlog-processing` | `0 3 * * *` | Daily backlog of unprocessed articles |
| `locked-topic-scan` | `15 */2 * * *` | Surveillance scanning for Locked Topics |
| `notification-immediate` | Every 10s | Deliver HIGH/CRITICAL priority notifications |
| `notification-batch` | Every 5min | Deliver NORMAL/LOW priority notifications |
| `notification-digest` | Every 15min | Compile and send due digests |
| `health-monitor` | Every 15min | System health checks, admin alerts |
| `notification-retention` | Daily 04:00 | Delete notifications per retention policy |
| `topic-summarizer` | On-demand | Generate topic summaries for archived topics |

All workers: `node-version: "25"`, `npx prisma generate`, inject secrets + vars via env.

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
- pg-boss workers run in same process — long-running jobs block scheduler; use `await boss.send()` for async
- Notification delivery workers are separate pg-boss jobs — check `ingestion-service/lib/boss.js`