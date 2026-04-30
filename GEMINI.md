# Global News Aggregator — GEMINI Context

This document provides foundational architecture, development workflows, and project state for the **Global News Aggregator**. Adhere to these standards for all codebase modifications.

## 🏗️ Architecture Overview

The project is a two-service monorepo:

- **Ingestion Service**: Node.js ESM background worker. Fetches RSS, deduplicates, and enriches with AI (Groq/OpenRouter).
- **Frontend**: Next.js 16 (App Router) + React 19 + TailwindCSS 4 + Prisma.

### Data Flow
`RSS Source -> Ingestion (Dedup) -> PostgreSQL (RawArticle) -> AI Processor -> PostgreSQL (ProcessedArticle) -> Next.js API -> Frontend UI`

## 🛠️ Tech Stack

- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Backend**: Node.js (ESM), `rss-parser`, `tiktoken`, `p-limit`
- **AI**: Groq (Primary: Llama 4 Scout), OpenRouter (Fallback/Frontend)
- **Frontend**: Next.js 16, TailwindCSS 4, shadcn/ui, HugeIcons

## 📁 Project Structure

- `ingestion-service/`: Core data pipeline.
    - `ai/`: AI client, rate limiter, token batcher, and result processor.
    - `sources/`: RSS feed configurations and fetchers.
    - `db/`: Prisma client for the worker.
- `frontend/`: Next.js application.
    - `app/api/articles/`: Main data endpoint.
    - `components/`: UI components (ArticleCard, SentimentBadge, etc.).
- `prisma/`: Shared database schema.
- `docs/`: Phase documentation and architecture notes.

## 🚀 Key Commands

### Ingestion Service
- `npm run ingest`: Fetch RSS and process with AI.
- `npm run ingest:raw`: Fetch RSS only, skip AI (`--skip-ai`).
- `npm run backlog`: Process existing `RawArticles` through AI (`--limit=N`).

### Frontend
- `cd frontend && npm run dev`: Start Next.js development server.
- `cd frontend && npx prisma migrate dev`: Apply database migrations.

## 📝 Development Conventions

- **Streaming-First**: Favor async generators and micro-batching. Avoid loading large datasets into memory.
- **Deduplication**: Multi-layer dedup using URL normalization and content hashing (`title + snippet`).
- **AI Pacing**: Use the custom sliding-window rate limiter in `ingestion-service/ai/rateLimiter.js`. Do not parallelize AI batches (keep concurrency = 1).
- **Type Safety**: Maintain synchronization between the root Prisma schema and both service clients.
- **Perspective Transparency**: Bias detection is for informational transparency (Perspective Badges), not automated "correction".

## 📍 Current Project State (Phase 1+)

- **Ingestion**: Fully functional with rate-limited AI enrichment.
- **Frontend**: Basic functional UI with category/country filtering support in the API.
- **Pending**: User system, notifications (Discord/Telegram), full-text search, and deployment configuration.

---
*Last Updated: May 2026*
