# Project Architecture and Conventions

This document provides foundational architecture, development workflows, and project state for the Global News Aggregator.

## 🏗️ Architecture Overview

The project is a two-service monorepo:

- **Ingestion Service**: Node.js ESM modular monolith. Fetches RSS, deduplicates, and enriches with AI (Mistral/Groq).
- **Frontend**: Next.js 16 (App Router) + React 19 + TailwindCSS 4 + Prisma + Zustand.

### Data Flow
`RSS Source -> Ingestion (Dedup) -> PostgreSQL (RawArticle) -> AI Processor -> PostgreSQL (ProcessedArticle) -> Next.js API (/api/articles) -> Frontend UI`

### Ingestion Service Architecture

The ingestion service follows a **modular monolith** pattern with an **orchestrator pattern**: four thin entry-point scripts at root each wire together dependencies and run a single pipeline. Feature directories (`newsPipeline/`, `clustering/`, `topics/`) encapsulate domain logic independently. Shared infrastructure (`ai/`, `utils/`) is consumed by multiple features.

**Key design principles:**
- **Orchestrators at root** — `runIngest.js`, `runClustering.js`, `processTopics.js`, `processBacklog.js` are thin scripts that compose features
- **Feature directories** — each owns its domain logic, prompts, and feature-specific utilities
- **Shared infrastructure** — `ai/` (LLM client, rate limiter, token management) and `utils/` (revalidation, logging, formatting) are consumed across features
- **Data layer** — `data/` holds static configuration (feed definitions, gazetteer dictionaries); `db/` is a thin Prisma wrapper

## 🛠️ Tech Stack

- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Backend**: Node.js (ESM), `rss-parser`, `tiktoken`, `p-limit`
- **AI**: Multi-provider strategy (Groq + Google AI Studio). See [AI Model Strategy Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/AI_MODELS.md) for assignments.
- **Frontend**: Next.js 16, TailwindCSS 4, shadcn/ui, HugeIcons, Zustand

## 📁 Project Structure

```
ingestion-service/
├── runIngest.js              # orchestrator: RSS fetch → dedup → AI enrich → revalidate
├── runClustering.js          # orchestrator: story clustering
├── processTopics.js          # orchestrator: locked topic scanning
├── processBacklog.js         # orchestrator: unprocessed article backlog
├── ai/                       # shared AI infrastructure (used by all features)
│   ├── aiConfig.js           # provider config (Mistral/Groq endpoints, keys, limits)
│   ├── requestAI.js          # LLM API client with fallback + retry logic
│   ├── rateLimiter.js        # sliding window rate limiter (TPM/RPM)
│   └── tokenBatcher.js       # token counting, truncation, batch composition
├── newsPipeline/             # unified ingestion + enrichment pipeline
│   ├── rss.js                # RSS/Atom stream fetcher
│   ├── stage1.js             # deterministic classification (gazetteer regex)
│   ├── stage2.js             # LLM enrichment (entities, sentiment, bias)
│   ├── enrichmentPipeline.js # batching, stage orchestration, DB commit
│   └── prompts/              # LLM prompt templates
├── clustering/               # story clustering feature
│   ├── clusteringEngine.js   # LLM-based story grouping
│   ├── lifecycle.js          # cluster state transitions (active → stale → archived)
│   └── utils/                # entity overlap, relevance scoring, key developments
├── topics/                   # locked topics feature
│   ├── scanner.js            # scanner orchestrator
│   ├── scorer.js             # LLM-based finding scoring
│   ├── notifier.js           # notification dispatch
│   ├── overviewGenerator.js  # topic summary generation
│   ├── sources/              # scanner implementations (Brave, Reddit, RSS, GitHub, etc.)
│   └── utils/                # parseQuery.js, formatSinceDate.js
├── data/                     # static data + configuration
│   ├── gazetteer.json        # category/region keyword dictionaries
│   └── feeds.js              # RSS feed definitions (builtin + user custom)
├── db/
│   └── prisma.js             # self-contained Prisma client
├── utils/                    # shared utilities
│   ├── revalidateCache.js    # Next.js cache invalidation
│   ├── logAiUsage.js         # AI usage tracking
│   ├── generateSlug.js       # URL slug generation
│   ├── formatDuration.js     # millisecond → human-readable duration
│   ├── hashSnippet.js        # SHA-256 content hashing
│   ├── normalizeUrl.js       # URL normalization
│   ├── regionMapping.js      # country → geopolitical region mapping
│   └── cleanupOldSkippedArticles.js
└── constants/
    └── categories.js         # category definitions
```

```
frontend/
  app/
    api/
      articles/
        route.ts      ← GET /api/articles?cursor&category&sort&search (pagination endpoint)
      revalidate/
        route.ts      ← GET /api/revalidate?tag=&secret= (on-demand cache invalidation)
    analytics/
        page.tsx        ← Analytics page: hosts all four insight widgets
    page.tsx          ← Home feed (server component, SSR first page)
    layout.tsx        ← Root layout: Navbar + responsive Sidebar + Footer + Suspense shell
  components/
    Feed/
      ArticleFeed.tsx ← Client component: owns article list state + IntersectionObserver
      ArticleCount.tsx← Client component: reads live count from Zustand store
      FeedSkeleton.tsx← Skeleton components: ArticleCardSkeleton, FiltersSkeleton, FeedSkeleton
      Filters.tsx     ← Server component: fetches categories, renders pills + sort + count
      CategoryFilter.tsx ← Client component: category pill navigation
      Sort.tsx        ← Client component: sort select (URL-driven)
    layout/
      Navbar.tsx      ← Header: logo, SearchBar (Suspense-wrapped), notifications, theme toggle
      Sidebar.tsx     ← Desktop sidebar (icon-only at md, full labels at lg)
      NavLinks.tsx    ← Nav links; supports alwaysFull prop for mobile drawer
      MobileNavDrawer.tsx ← Mobile Sheet drawer (hamburger trigger, closes on navigation)
      SearchBar.tsx   ← Search: desktop input + mobile tap-to-expand overlay
    articles/
      ArticleCard.tsx
      SentimentBadge.tsx
    widgets/
      PerspectiveWidget.tsx
      EventClustersWidget.tsx
      BiasDistributionWidget.tsx
      DiversityInsightWidget.tsx
  store/
    index.ts          ← Zustand store: FeedSlice (live) + NotificationSlice/UserSlice (stubs)
  queries/
    articles.ts       ← getArticles(): cursor-based pagination, 'use cache', returns { articles, nextCursor }
    categories.ts     ← getCategories(): 'use cache'
  types/
    article.ts        ← Article interface

prisma/               ← Shared database schema
docs/                 ← Phase documentation and architecture notes
```

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
- **AI Pacing**: Use the custom sliding-window rate limiter in `ingestion-service/ai/rateLimiter.js`. Do not parallelize AI batches (keep concurrency = 1). Adhere to model assignments in `docs/AI_MODELS.md`.
- **Type Safety**: Maintain synchronization between the root Prisma schema and both service clients.
- **Perspective Transparency**: Bias detection is for informational transparency (Perspective Badges), not automated "correction".
- **URL-Driven Filters**: Category, sort, and search are all stored as URL query params. This enables server-side rendering, shareable URLs, and browser back/forward navigation.
- **Zustand Selectors**: Always use the exported selector hooks (`useArticleCount`, `useSetArticleCount`, etc.) — never `useAppStore` directly. Selectors prevent re-renders from unrelated state changes.
- **Explicit Caching**: `cacheComponents: true` is enabled. Nothing is cached unless explicitly marked with `'use cache'`. Cache at the data-function level (not the component level) unless there is a strong reason to cache UI.
- **Suspense for Runtime APIs**: Any client component that reads `useSearchParams`, `cookies`, or other runtime APIs must be wrapped in `<Suspense>` when rendered inside the static shell (layout). Failing to do so causes a blocking-route build error.
- **Skeletons for Loading States**: Use `<Skeleton>` (shadcn) for all loading/fallback states. `FeedSkeleton`, `ArticleCardSkeleton`, and `FiltersSkeleton` are available in `components/Feed/FeedSkeleton.tsx`.

## 🗂️ Category System

Categories are a **fixed, canonical list** — not AI-generated dynamically. This prevents category drift and keeps the filter UI predictable.

**Source of truth**: `ingestion-service/constants/categories.js` → `ALLOWED_CATEGORIES`

**Current categories** (11 total):
| Category | Scope |
|---|---|
| `geopolitics` | Wars, diplomacy, international relations |
| `economy` | **Macro**: inflation, trade policy, GDP, sanctions, central banks |
| `business` | **Micro**: company earnings, M&A, startups, IPOs, corporate strategy |
| `technology` | AI, cyber, space, big tech |
| `environment` | Climate, disasters, energy transition |
| `health` | Pandemics, public health policy |
| `security` | Terrorism, crime, military operations |
| `politics` | Elections, governance, domestic policy |
| `society` | Culture, human rights, education, social issues |
| `bangladesh` | Bangladesh-specific news (any topic) |
| `other` | Catch-all fallback |

**Enforcement is two-layered**:
1. The AI prompt explicitly lists `ALLOWED_CATEGORIES` and instructs the model not to invent new ones.
2. `processor.js` filters the AI response against `ALLOWED_CATEGORIES` before writing to DB — invalid categories are dropped and logged; articles with zero valid categories fall back to `["other"]`.

**Adding a new category**: update `ALLOWED_CATEGORIES` in `constants/categories.js` only. The prompt and server-side filter both read from it automatically.

## 📄 Pagination

Articles use **cursor-based pagination** — not offset.

**Why cursor over offset**: offset breaks on a live feed (new ingestions shift row positions, causing skips/duplicates). Cursor points to a specific record and is stable regardless of inserts.

**Implementation**:
- `getArticles()` accepts an optional `cursor` (the `id` of the last seen `ProcessedArticle`).
- Uses Prisma's `cursor: { id }` + `skip: 1` mechanism.
- `orderBy` always includes `{ id: "asc" }` as a tiebreaker to prevent ambiguous cursor positions when two articles share the same `publishedAt`.
- Uses the **take + 1 trick**: fetches `TAKE + 1` (21) rows. If 21 come back, there is a next page; `nextCursor` is the 20th item's `id`. If ≤ 20 come back, `nextCursor` is `null`. No separate `COUNT` query needed.
- `GET /api/articles?cursor=&category=&sort=&search=` is the pagination endpoint.
- `ArticleFeed.tsx` owns the client-side article list state and uses `IntersectionObserver` (with `rootMargin: 300px`) to pre-fetch the next page before the sentinel enters the viewport.
- `page.tsx` fetches the **first page server-side** (SSR/SEO). `ArticleFeed` takes over from there.
- When filters change, `page.tsx` re-runs and passes new initial data. A `key={category|sort|search}` prop on `<ArticleFeed>` forces a full remount, cleanly resetting the article list and cursor.

## ⚡ Caching & Rendering (PPR)

The app uses **Partial Pre-Rendering (PPR)** via `cacheComponents: true` in `next.config.ts`. The mental model: everything is dynamic by default; opt in to caching explicitly with `'use cache'`.

### Static Shell vs Dynamic Content

```
layout.tsx  →  static shell (Navbar, Sidebar, Footer) — prerendered at build time
  └── <Suspense fallback={<FeedSkeleton />}>
        page.tsx  →  dynamic (reads searchParams at request time)
          ├── getCategories()  ← cached
          └── getArticles()   ← cached per (category, sort, search, cursor)
```

The `<Suspense>` boundary in `layout.tsx` is what makes this work. The shell renders instantly; the page content streams in while `FeedSkeleton` holds the shape.

### Cached Functions

| Function | Tag | Lifetime | Invalidated by |
|---|---|---|---|
| `getArticles()` | `articles` | `cacheLife('minutes')` — revalidate 1m, expire 1h | `updateTag('articles')` after ingest |
| `getCategories()` | `categories` | `cacheLife('days')` — revalidate 1d, expire 1w | Manual when ALLOWED_CATEGORIES changes |

**Cache key**: arguments passed to a `'use cache'` function automatically form the cache key. Each unique `(category, sort, search, cursor)` combination is a separate entry.

### On-Demand Revalidation

`GET /api/revalidate?tag=articles&secret=REVALIDATE_SECRET`

Protected by the `REVALIDATE_SECRET` environment variable. Call this from the ingestion service after each successful batch to immediately purge stale article results. Uses `revalidateTag(tag, "max")` for background revalidation (stale-while-revalidate).

**updateTag vs revalidateTag**: 
- Use `updateTag(tag)` in **Server Actions** for immediate "read-your-own-writes" consistency. It forces an immediate cache expiry.
- Use `revalidateTag(tag, "max")` in **Route Handlers** and background tasks for performance-optimized background revalidation (SWR).

### Suspense and Runtime APIs

Client components that call `useSearchParams()` (or other runtime APIs) **must** be wrapped in `<Suspense>` when they live in the static shell. Failing to do so causes a `Blocking Route` build error.

Current wrapping in `Navbar.tsx`:
- Desktop `<SearchBar />` → `<Suspense fallback={<Skeleton className="h-9 w-full rounded-lg" />}>`
- Mobile `<SearchBar />` → `<Suspense fallback={<Skeleton className="h-9 w-9 rounded-lg" />}>`

### Adding New Cached Functions

1. Add `'use cache'` as the first statement in the function body.
2. Call `cacheTag('your-tag')` to enable on-demand invalidation.
3. Call `cacheLife('minutes' | 'hours' | 'days' | ...)` to set the lifetime.
4. If the data can be mutated by user actions, wire `updateTag('your-tag')` into the relevant Server Action or call the revalidate endpoint.

## 🌐 Responsive Layout

| Breakpoint | Sidebar | Feed | Widgets |
|---|---|---|---|
| `< md` (< 768px) | Hidden → Sheet drawer (hamburger in Navbar) | Full width | Hidden |
| `md → lg` (768–1024px) | Icon-only (w-14 / 56px) | flex-1 | Hidden |
| `lg → xl` (1024–1280px) | Full labels (w-56 / 224px) | flex-1 | Hidden |
| `xl+` (≥ 1280px) | Full labels | flex-1 | Right panel (w-72 / 288px) |

**`NavLinks` `alwaysFull` prop**: The sidebar uses responsive Tailwind classes (`hidden lg:block`) to toggle labels. The mobile Sheet drawer passes `alwaysFull={true}` to bypass these classes and always show icon + label, since the viewport is mobile regardless of the drawer's visual size.

**`MobileNavDrawer`**: Controlled Sheet (`open`/`onOpenChange` state). Closes automatically when any nav link is clicked (via `onNavigate` callback) or the logo is tapped.

**`SearchBar`**: Desktop renders a persistent input. Mobile renders an icon button; tapping it shows a full-width overlay that covers the Navbar. `sticky` on the header establishes the containing block for the `absolute`-positioned overlay — no extra `relative` wrapper needed.

## 🗃️ Zustand Store (`frontend/store/index.ts`)

The store is structured as **typed slices** so each feature can be added independently.

| Slice | State | Status |
|---|---|---|
| `FeedSlice` | `articleCount` | Live — updated by `ArticleFeed` on every page load |
| `NotificationSlice` | `unreadCount` | Stub — wire up when notifications are built |
| `UserSlice` | `user: null` | Stub — wire up when auth is built |

**Always use the exported selector hooks** — not `useAppStore` directly:
- `useArticleCount` / `useSetArticleCount`
- `useUnreadCount` / `useSetUnreadCount`

**When to add to the store**: cross-component or cross-layout state that doesn't belong in a URL param. Auth state, notification badge counts, and feed metadata are good candidates. Per-page ephemeral state (form values, local toggles) should stay in component `useState`.

## 🔍 Search

Search is URL-driven (`?search=query`) and consistent with the category/sort pattern. `getArticles()` applies a Prisma `OR` filter with `mode: "insensitive"` across `rawArticle.title`, `rawArticle.contentSnippet`, and `rawArticle.source`.

**Current limitation**: `ILIKE '%query%'` cannot use standard B-tree indexes. Adequate for current scale. Upgrade path when needed: PostgreSQL full-text search (`tsvector` + GIN index) via Supabase FTS or `prisma.$queryRaw`.

`SearchBar.tsx` debounces URL writes by 400ms and uses `router.replace` (not `push`) to avoid polluting browser history on each keystroke.

## 📍 Current Project State

- **Ingestion**: Fully functional with rate-limited AI enrichment and fixed-category enforcement.
- **Frontend**: Responsive UI with category/sort/search filtering, cursor-based infinite scroll, Zustand state management, PPR with explicit caching, and an Analytics page.
- **Topics**: Semantic Concept Filtering and independent scanners implemented.
- **Caching**: `getArticles()` and `getCategories()` are cached with `'use cache'`. On-demand invalidation endpoint exists at `/api/revalidate` — needs to be wired to the ingestion service with `REVALIDATE_SECRET` set in env.
- **Analytics page** (`/analytics`): Currently hosts the four static insight widgets (PerspectiveWidget, EventClustersWidget, BiasDistributionWidget, DiversityInsightWidget). Data is still hardcoded — needs to be wired to real DB aggregations.
- **Prisma Architecture**: The Prisma client is configured to output to a single shared directory (`shared/prisma-client`). Both the frontend and backend import from this location to prevent schema desynchronization.
- **Pending**: User system, notifications (Discord/Telegram), full-text search upgrade, widget data from real DB queries, ingestion → revalidate webhook, deployment configuration.
