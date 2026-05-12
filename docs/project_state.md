# Global News Aggregator — Project State

## Architecture Overview

The project is a **two-service monorepo** hosted on a single Git repo (`dev` branch active, 4 commits ahead of `main`):

```mermaid
graph LR
    subgraph "Ingestion Service (Node.js / ESM)"
        RSS[RSS Fetcher] --> Dedup[URL + Hash Dedup]
        Dedup --> DB1[(Supabase PostgreSQL)]
        Dedup --> AI[AI Processor]
        AI --> DB1
    end

    subgraph "Frontend (Next.js 16 + TailwindCSS 4)"
        API["/api/articles route"] --> DB2[(Same Supabase DB)]
        DB2 --> UI[React Client Page]
    end

    DB1 -.- DB2
```

| Layer             | Tech Stack                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| **Database**      | Supabase PostgreSQL, Prisma ORM v6.19 (root) / v7.8 (frontend)            |
| **Ingestion**     | Node.js ESM, `rss-parser`, `tiktoken`, `p-limit`, raw `fetch` for AI APIs |
| **AI Processing** | Groq (primary) + OpenRouter (fallback), batch prompt → JSON               |
| **Frontend**      | Next.js 16, React 19, TailwindCSS 4, shadcn/ui, Lucide icons              |

---

## What's Working ✅

### Ingestion Pipeline (fully functional)

- **RSS streaming** from configured sources — currently only **The Daily Star (Bangladesh)** is active; 6+ others are commented out (Al Jazeera, Dhaka Tribune, UN News, TechCrunch, etc.)
- **Two-layer deduplication**: URL normalization + content hash (`title + contentSnippet`)
- **Database persistence**: new articles saved as `RawArticle` rows
- **AI batch processing**: articles are token-batched (~800 tokens/batch), sent to Groq/OpenRouter for categorization, entity extraction, sentiment scoring, and bias detection
- **Processed article storage**: AI results saved as `ProcessedArticle` with linked `Category` records
- **AI usage tracking**: token counts and estimated costs logged to `AiUsage` table
- **Resilience**: primary/fallback AI provider switching, rate-limit handling with `retry-after`, configurable timeouts and retry attempts
- **Latest run**: 10 articles fetched, 10/10 inserted, 10/10 AI-processed in 13.8s

### Locked Topics Surveillance (fully functional)

- **Multi-Tier Acquisition**: Includes API scanners (Internal DB, RSS, Reddit, Brave, GitHub, YouTube) and HTML scrapers (Webpage Diffs, BD Gov Jobs, Company Careers/ATS).
- **AI Refinement**: Uses Gemini to convert user intent into optimized query strings and suggested sources.
- **Relevance Scoring**: Findings are batched and scored (0.0 to 1.0) by Groq before saving, logging tokens to `AiUsage`.
- **Live Intelligence Synthesis**: Integrates Brave's native AI search summaries for real-time situational reporting on the topic dashboard.
- **Notifications**: Discord and Telegram alerts dispatched based on relevance thresholds (DIGEST or ALERT modes).
- **Lifecycle & Archival**: Topics can be archived, deleting heavy finding records while preserving a Gemini-generated historical summary in the database.
- **Automated Scheduling**: Independent GitHub Actions workflow (`locked-topics.yml`) running at `:15` past the hour to prevent ingestion overlap.

### Database Schema (7 models, migrated)

| Model                | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `RawArticle`         | Raw RSS data with URL + content hash dedup                                   |
| `ProcessedArticle`   | AI enrichment (categories, entities, sentiment, bias, perspective countries) |
| `Category`           | Many-to-many with ProcessedArticle                                           |
| `User` / `UserTopic` | User alert subscriptions (schema only, not wired)                            |
| `AiUsage`            | Per-batch AI cost/token tracking                                             |
| `LockedTopic`        | Configuration and metadata for persistent tracking                           |
| `TopicFinding`       | Individual matches from across all scanners and scrapers                     |

### Frontend (functional)

- **API routes** — heavily cached Server Components with on-demand invalidation via `/api/revalidate`.
- **Client pages** — article card grid, topic grids, dynamic modals for creation/deletion/editing.
- **Category filter dropdown** (hardcoded: all / geopolitics / bangladesh / technology)
- Dev server running on `localhost:3000`

---

## What's Partially Built / Rough Edges ⚠️

| Item                        | Status                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma version mismatch** | Root uses `^6.19.3`, frontend uses `^7.8.0` — potential schema/client drift                                                                                                                                                                                                                                             |
| **Frontend Prisma client**  | Uses a separate [lib/prisma](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/lib) (not the shared [lib/db.ts](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/lib/db.ts)) — two separate Prisma setups |
| **Category filter**         | Hardcoded options in the dropdown; not dynamically fetched from DB                                                                                                                                                                                                                                                      |
| **Frontend design**         | Functional but basic — TailwindCSS card grid, no dark mode, no animations, "Testing ingestion workflow output" subtitle                                                                                                                                                                                                 |
| **RSS sources**             | Only 1 of 7+ sources enabled — the rest are commented out                                                                                                                                                                                                                                                               |
| **`n8n-workflows/`**        | Directory exists but is empty                                                                                                                                                                                                                                                                                           |
| **`infra/`**                | Directory exists but is empty                                                                                                                                                                                                                                                                                           |

---

## What's Not Built Yet 🚧

- **User system** — `User` and `UserTopic` models exist in schema but nothing reads/writes them
- **Full-text search** — no search functionality on the frontend
- **Country/region filtering UI** — API supports `?country=` but no UI for it
- **Article detail view** — cards link directly to external source URLs
- **Deployment / CI/CD** — no Dockerfile, no GitHub Actions (except for cron), no deployment config
- **Testing** — no tests (`"test": "echo \"Error: no test specified\""`)


---

## File Map

```
global-news-aggregator/
├── prisma/schema.prisma          # Shared DB schema (5 models)
├── prisma.config.ts              # Prisma connection config
├── lib/db.ts                     # Shared Prisma client singleton
├── package.json                  # Root deps (Prisma 6, rss-parser, tiktoken, etc.)
│
├── ingestion-service/
│   ├── index.js                  # Entry point — RSS fetch → dedup → DB → AI queue
│   ├── sources/rss.js            # RSS stream fetcher
│   ├── db/client.js              # Ingestion Prisma client
│   ├── ai/
│   │   ├── client.js             # AI API client (Groq/OpenRouter, fallback, rate limits)
│   │   ├── processor.js          # Batch queue, DB persistence of AI results
│   │   └── tokenBatcher.js       # Token-aware batching with tiktoken
│   └── utils/
│       ├── hashSnippet.js        # Content hash for dedup
│       └── normalizeUrl.js       # URL normalization
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main UI — article card grid
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind + custom styles
│   │   └── api/articles/route.ts # GET /api/articles endpoint
│   ├── lib/                      # Frontend Prisma client
│   └── components/               # (shadcn/ui setup, minimal usage)
│
├── docs/phase-0.md               # Phase 0 completion notes
├── infra/                        # Empty — no deployment config yet
└── n8n-workflows/                # Empty — no automation workflows yet
```

---

## Summary

**You're at the end of Phase 1.** The core data pipeline works end-to-end: RSS → dedup → DB → AI enrichment → API → basic UI. The next natural steps would be:

1. **Enable more RSS sources** and stress-test the pipeline
2. **Schedule ingestion** (cron / n8n / background worker)
3. **Improve the frontend** — dynamic categories, search, dark mode, polish
4. **Wire up notifications** — Discord/email alerts for tracked topics
5. **Unify Prisma versions** across root and frontend
6. **Add tests and CI/CD**

---

To make the data from your Prisma database available in your Next.js 16 frontend, you generally need to follow these conceptual steps:

**1. Create a Prisma Client Instance for the Frontend**
Because Next.js reloads frequently in development, you need to create a "singleton" instance of the Prisma Client inside your `frontend` directory. This ensures you only create one active connection to the database at a time and prevents connection pool exhaustion.

**2. Fetch the Data (Choose an Approach)**
With the Next.js App Router, you have two primary ways to get that data from Prisma into your UI:

- **Approach A: Server Components (Recommended & Fastest)**
  Since Server Components run securely on the server, you can import your Prisma client directly into your page files (e.g., `app/page.tsx`). You simply `await` the database query right inside the component and pass the raw data down to your visual components.
- **Approach B: API Route Handlers (Best for Client-side fetching)**
  If you have highly interactive components that need to fetch data on the fly (like infinite scrolling or complex client-side filters), you will create an API route (e.g., `app/api/articles/route.ts`). This route uses Prisma to query the database and returns the data as JSON.

**3. Consume and Render the Data in the UI**

- If you used **Server Components**, you already have the data and can just map over it to render your UI elements (like your `ArticleCard`).
- If you used **API Routes**, you will need to use a fetching mechanism (like the native `fetch` API, SWR, or React Query) inside your React components to call your new API endpoint, store the result in React state, and then render it.

**4. Handle Filtering and Pagination**
As your database grows, you won't want to load every article at once. You will need to implement logic (either via URL search parameters in Server Components or query strings in API routes) to tell Prisma to `take` a limited number of records and `skip` others, or to `where` filter by specific categories or countries.
