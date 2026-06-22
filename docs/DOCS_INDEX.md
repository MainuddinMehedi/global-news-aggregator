# Global News Aggregator — Documentation Master Index

This index serves as the entry point and mindmap for the project's documentation. The project is split into the Next.js frontend and the Node.js ESM ingestion service.

# References
(*Quick references for quick lookups*)

- 

---

### 📖 Table of Contents

- [[#1. Documentation Standards]]
- [[#2. Architecture & Conventions]]
- [[#3. Feature Documents (Numbered)]]
- [[#4. Project State & Ops]]
- [[#5. Historical Drafts & Archive]]

---

## 1. Documentation Standards

- [[docs/templates/FEATURE_TEMPLATE|Feature Document Template]]  
  The standardized outline and lifecycle document template for all new and existing features. Contains sections for research, architecture, implementation guides, roadmap, and brainstorming.

---

## 2. Architecture & Conventions

- **[Architectural Philosophy: The "User-Agnostic" News Engine](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/architecture-philosophy.md)**  
  The core identity of the platform, explaining the "Views, Not Silos" philosophy and the strict 10-category lock.
- **[Project Architecture & Conventions](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/project_architecture_and_conventions.md)**  
  Foundational directory layout, key commands, coding style rules, pagination logic, and caching structures.
- **[AI Model Strategy Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/AI_MODELS.md)**  
  Definitive model assignments across the stack, detailing Mistral AI (including Ministral 8B in chat), Groq, and Google AI Studio usage for optimal speed, intelligence, and cost.
- **[pgvector-and-tsvector](pgvector-and-tsvector.md)**  
  Analysis of Supabase-native vector and full-text search capabilities, current gaps, and a proposal for hybrid search across articles, locked topics, and clustering.
- **[Loading Skeletons & Next.js Routing Conventions](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/loading-skeletons.md)**  
  Specifications for page loading skeletons, matching layout grids, modularization, and native Next.js route segment loading.

**Ingestion service folder structure**

The ingestion service is a **modular monolith** with an **orchestrator pattern**: four thin entry-point scripts at root each wire together dependencies and run a single pipeline. Feature directories (`newsPipeline/`, `clustering/`, `topics/`) encapsulate domain logic independently. Shared infrastructure (`ai/`, `utils/`) is consumed by multiple features.

```
ingestion-service/
├── runIngest.js              # orchestrator: RSS fetch → dedup → AI enrich → revalidate
├── runClustering.js          # orchestrator: story clustering
├── processTopics.js          # orchestrator: locked topic scanning
├── processBacklog.js         # orchestrator: unprocessed article backlog
│
├── ai/                       # shared AI infrastructure (used by all features)
│   ├── aiConfig.js           # provider config (Mistral/Groq endpoints, keys, limits)
│   ├── requestAI.js          # LLM API client with fallback + retry logic
│   ├── rateLimiter.js        # sliding window rate limiter (TPM/RPM)
│   ├── tokenBatcher.js       # token counting, truncation, batch composition
│   └── embeddings.js         # batch embeddings client using Google AI Studio (gemini-embedding-001)
│
├── newsPipeline/             # unified ingestion + enrichment pipeline
│   ├── rss.js                # RSS/Atom stream fetcher
│   ├── stage1.js             # deterministic classification (gazetteer regex)
│   ├── stage2.js             # LLM enrichment (entities, sentiment, bias)
│   ├── enrichmentPipeline.js # batching, stage orchestration, DB commit
│   └── prompts/              # LLM prompt templates
│
├── clustering/               # story clustering feature
│   ├── clusteringEngine.js   # LLM-based story grouping
│   ├── lifecycle.js          # cluster state transitions (active → stale → archived)
│   ├── dedup.js              # post-run medoid-based duplicate cluster merging
│   └── utils/                # clustering helpers
│       ├── overlap.js        # pre-clustering entity & vector-distance adjacency builder
│       ├── relevance.js      # raw SQL candidate selection with legacy fallback and fast-exit
│       └── keyDevelopments.js# cluster key development extractor/merger
│
├── topics/                   # locked topics feature
│   ├── scanner.js            # scanner orchestrator
│   ├── scorer.js             # LLM-based finding scoring
│   ├── notifier.js           # notification dispatch
│   ├── overviewGenerator.js  # topic summary generation
│   ├── scannerConfig.js      # centralized constants (maxResults, minRelevance)
│   ├── backfillLockedTopicEmbeddings.js # vector embedding backfill script
│   ├── sources/              # scanner implementations (Brave, Reddit, RSS, GitHub, etc.)
│   └── utils/                # parseQuery.js, formatSinceDate.js
│
├── data/                     # static data + configuration
│   ├── gazetteer.json        # category/region keyword dictionaries
│   └── feeds.js              # RSS feed definitions (builtin + user custom)
│
├── db/                       # database
│   ├── prisma.js             # self-contained Prisma client
│   └── restore-indexes.js    # utility to restore custom pgvector indexes
│
├── utils/                    # shared utilities
│   ├── revalidateCache.js    # Next.js cache invalidation
│   ├── logAiUsage.js         # AI usage tracking
│   ├── generateSlug.js       # URL slug generation
│   ├── formatDuration.js     # millisecond → human-readable duration
│   ├── hashSnippet.js        # SHA-256 content hashing
│   ├── normalizeUrl.js       # URL normalization
│   ├── regionMapping.js      # country → geopolitical region mapping
│   └── cleanupOldSkippedArticles.js
│
└── constants/
    └── categories.js         # category definitions
```

---

## 3. Feature Documents (Numbered)

These documents represent the source of truth for each major platform feature. They conform to the standardized outline format and are ordered by logic and data flow.

1. **[1. Ingestion & Enrichment Pipeline](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/1.%20enrichment-pipeline/0.enrichment-pipeline.md)**  
   The two-stage parsing flow: Stage 1 local Regex Gazetteer sieve and Stage 2 Python FastAPI NLP microservice (GLiNER + VADER).
2. **[2. Story Clustering](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/2.%20story/0.story-clustering.md)**
   The end-to-end grouping engine that matches geopolitical entities and runs batch LLM categorization to group news articles into stories.
   - **[Clustering Technical Audit](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/2.%20story/clustering-audit.md)**: Reviews algorithm limitations, O(N²) scaling, heuristics, and detail optimization pathways using `pgvector`.
3. **[3. Locked Topics](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/3.%20locked-topics/0.locked-topics.md)**  
   The user-defined custom tracking feature that executes multi-source scans (Google News, Brave, Reddit, web scrapers) and rates findings via AI.
   - **[Scanner Flow Audit](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/3.%20locked-topics/scanner-flow-audit.md)**: Details the ingestion orchestrator, source configuration, data persistence, and relevance scoring.
4. **[4. Feed, Pagination, & 3-Axis Filtering](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/5.%20feed-&-metadata-specific/0.feed-filtering.md)**  
   Cursor-based infinite scroll pagination, URL query syncer, responsive layout grid, and the 3-axis filters (Event Region, Source Origin, Source Type).
5. **[5. Authentication & Role-Based Access Control (RBAC)](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/auth-rbac.md)**  
   Session handling via NextAuth.js and Prisma, defining scopes for Public, Authenticated, and Admin users.
6. **[6. Admin Dashboard](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/4.%20admin-dashboard/0.admin-dashboard.md)**  
   Core administration panel for system health telemetry, ingestion crawler configuration, feed management, user permissions audit, and interactive gazetteer tuning sandbox.
7. **[7. Chat Interface](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/6.%20chat/0.%20chat-interface.md)**  
   Interactive multi-model AI global news analyst chat interface with context RAG grounding, voice-mode integration, and session history management. Uses [embeddings.ts](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/lib/ai/embeddings.ts) to embed user search queries and runs the `searchArticlesTool` (in [tools.ts](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/lib/ai/tools.ts)) to perform vector similarity lookups on Supabase.

---

## 4. Project State & Ops

- **[Project Status and ToDo's](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/PROJECT%20STATUS%20AND%20ToDo's.md)** _(User Authored)_  
  Tracking board for the project's current conditions, focus points, and remaining issues.
- **[Project Roadmap](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/PROJECT_ROADMAP.md)**  
  A backlog of tasks divided by priority and scope.
- **[GitHub Actions Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/GITHUB_ACTIONS_GUIDE.md)**  
  CI/CD deployment configurations and runner schedules.

---

## 5. Historical Drafts & Archive

Older drafts, development logs, and research files have been archived for record-keeping:

- **[Archive Dump Directory](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/archive_dump/)** — Contains raw files from early iterations of metadata strategy, gliner experimentation, and design logs.
