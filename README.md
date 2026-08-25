# 🧭 informnt

![Next.js](https://img.shields.io/badge/Next.js-16_PPR-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)
![pgvector](https://img.shields.io/badge/pgvector-HNSW_Cosine-7928CA?logo=postgresql)
![pg-boss](https://img.shields.io/badge/pg--boss-Queue_Workers-4169E1)
![Mistral AI](https://img.shields.io/badge/Mistral_AI-Primary_Pipeline-FF7000?logo=mistralai)
![Groq](https://img.shields.io/badge/Groq-Llama_4_Fallback-F55036)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-Embeddings-4285F4?logo=google)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss)

> **Multi-perspective geopolitical intelligence and real-time surveillance platform, synthesized by AI — your persistent investigative monitor for global events.**

---

## 🎯 Project Overview

**informnt** is an autonomous geopolitical news aggregation and surveillance platform designed to bridge information asymmetry, surface institutional biases, and continuously track critical global developments.

Rather than relying on single-source narratives, the platform ingests dozens of verified international wire services and regional publishers across **7 macro-regions**, structures timeline dossiers with vector clustering, and runs continuous background surveillance on user-defined **Locked Topics**.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend ["🖥️ Frontend Layer (Next.js 16)"]
        UI_Feed["3-Axis Multi-Perspective Feed"]
        UI_Dossier["Story Cluster Timelines"]
        UI_Topics["Locked Topics Surveillance"]
        UI_Chat["AI Intelligence Analyst (RAG)"]
    end

    subgraph Database ["🗄️ Database Layer (Supabase)"]
        DB_Articles[("Articles & Story Clusters")]
        DB_Vectors[("pgvector HNSW Cosine Index")]
        DB_Topics[("Surveillance Findings")]
    end

    subgraph Backend ["⚙️ Ingestion & Background Engine"]
        Worker_RSS["27 Global RSS Feed Fetchers"]
        Worker_AI["Stage 1 & 2 AI Enrichment (Mistral / Groq)"]
        Worker_Cluster["pgvector Story Clustering Pass"]
        Worker_Scan["Multi-Channel Topic Scanners"]
        Worker_Boss["pg-boss Queue Scheduler Daemon"]
    end

    Worker_RSS --> Worker_AI
    Worker_AI --> DB_Articles
    DB_Articles --> DB_Vectors
    DB_Vectors --> Worker_Cluster
    Worker_Scan --> DB_Topics

    Worker_Boss -.->|"Scheduled Triggers"| Worker_RSS
    Worker_Boss -.->|"Scheduled Triggers"| Worker_Cluster
    Worker_Boss -.->|"Scheduled Triggers"| Worker_Scan

    DB_Articles <-->|"Prisma Client Queries"| UI_Feed
    DB_Articles <-->|"Prisma Client Queries"| UI_Dossier
    DB_Topics <-->|"Prisma Client Queries"| UI_Topics
    DB_Articles <-->|"Semantic Search (RAG)"| UI_Chat
```

---

## ✨ Key Features

### 1. 📰 Multi-Perspective Global Ingestion

- **27 Verified Global & Regional Feeds**: Curated coverage across North America, Europe, Asia-Pacific, Middle East, Africa, South America, and South Asia.
- **Two-Layer Deduplication**: Normalized URL matching + SHA-256 content hashing to eliminate duplicates.
- **Gazetteer & Regex Pre-filtering**: High-speed keyword sieves filter out non-geopolitical content prior to LLM processing.

### 2. 🧠 Multi-Tier AI Pipeline with Failover

- **Primary AI Provider**: Mistral (`mistral-small-2506`) for high-throughput batch classification and entity extraction.
- **Fallback Provider**: Groq (`meta-llama/llama-4-scout-17b`) with automatic HTTP 429 adaptive backoff and hot-swapping.
- **Semantic Embeddings**: Google Gemini (`gemini-embedding-001`) producing 768-dimension vectors stored in PostgreSQL `pgvector`.
- **Adaptive Rate Limiting**: Rolling 60-second sliding-window token budgeter preventing API quota exhaustion.

### 3. 🛡️ Dynamic Story Clustering & Timeline Dossiers

- **Vector Cosine Similarity**: Clusters breaking news into unified story threads using PostgreSQL vector distance (`p.embedding <=> a.embedding`).
- **Fast-Exit Optimization**: Bypasses LLM prompt costs if candidate clusters exceed similarity distance thresholds (`0.38`).
- **Autonomous Deduplication**: Automatic merge passes resolve and consolidate duplicate clusters.

### 4. 🔍 Locked Topics Surveillance

- **Persistent Multi-Channel Scanners**: 24/7 background surveillance across Brave Search, GitHub, YouTube, Reddit, and RSS channels.
- **Automated AI Query Refinement**: Transforms vague user intents into structured search heuristics.
- **Live Situational Awareness**: Generates real-time overview briefs and archives completed topics with Gemini summaries.

### 5. 🤖 Embedded AI Analyst (RAG Chat)

- Embedded chat interface capable of semantic query routing, database lookups (`search_articles`), and external verification (`web_search`).
- Directly cites tracked articles, perspective badges, and timeline context.

### 6. 🔔 Multi-Channel Alert Delivery

- In-app notification bell with real-time polling.
- Telegram & Discord webhook dispatching powered by `pg-boss` background workers.

---

## 📁 Repository Structure

```
global-news-aggregator/
├── frontend/                     # Next.js 16 App Router UI
│   ├── app/                      # Routes (Feed, Stories, Locked Topics, Chat, Analytics)
│   │   ├── icon.svg              # Dynamic high-DPI vector favicon
│   │   └── apple-icon.tsx        # Apple touch icon generator
│   ├── components/
│   │   ├── ui/Logo.tsx           # Theme-adaptive portrait informnt Logo
│   │   ├── Feed/                 # Multi-axis article cards & filter bars
│   │   ├── locked-topics/        # Surveillance dashboards & creation wizard
│   │   └── chat/                 # Embedded AI Intelligence Analyst
│   ├── store/                    # Zustand client state stores
│   └── utils/                    # Geopolitical region mappings & helpers
├── ingestion-service/            # Node.js ESM Ingestion & Background Engine
│   ├── ai/                       # Rate limiting, batching & multi-provider routing
│   │   ├── requestAI.js          # Core LLM caller with 429 retry & fallback
│   │   ├── rateLimiter.js        # 60-second sliding-window token limiter
│   │   └── aiConfig.js           # Primary/Fallback model configuration
│   ├── clustering/               # Story clustering & pgvector relevance engine
│   ├── data/feeds.json           # 27 Curated global RSS feed definitions
│   ├── masterWorker.js           # pg-boss background worker daemon
│   └── runIngest.js              # Standalone ingestion pipeline runner
├── shared/prisma-client/         # Generated Prisma client shared across workspaces
├── prisma/                       # Database schema definition
│   └── schema.prisma             # Unified PostgreSQL + pgvector schema
└── scripts/                      # Database seeding, index restoration, and migrations
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: `v22.0.0+`
- **PostgreSQL**: `15+` with `pgvector` extension enabled (e.g. Supabase)

### 2. Environment Setup

Copy and configure environment variables in both root and frontend:

```bash
# Root Ingestion & Database Environment
cp .env.example .env

# Frontend Next.js Environment
cp .env frontend/.env.local
```

Key environment variables:

```ini
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
AUTH_SECRET="your-32-char-random-secret"
MISTRAL_API_KEY="your-mistral-key"
GROQ_API_KEY="your-groq-key"
GEMINI_API_KEY="your-gemini-key"
BRAVE_API_KEY="your-brave-search-key"
REVALIDATE_SECRET="your-cache-secret"
```

### 3. Initialize Database & Seed Feeds

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Seed database with the 27 curated global sources
npm run seed
```

### 4. Running the Application

```bash
# Terminal 1: Start Next.js Frontend
cd frontend
npm run dev

# Terminal 2: Run Background Ingestion Worker (or one-time pass)
npm run ingest      # Run single RSS ingestion pass
npm run cluster     # Run story clustering pass
npm run worker      # Run 24/7 background scheduler (pg-boss)
```

---

## 🛠️ CLI Commands Reference

| Command                      | Purpose                                                                 |
| :--------------------------- | :---------------------------------------------------------------------- |
| `npm run seed`               | Seed database with the 27 curated global news sources from `feeds.json` |
| `npm run ingest`             | Execute full RSS fetch, deduplication, and 2-stage AI enrichment        |
| `npm run ingest:raw`         | Fetch and deduplicate RSS feeds without AI enrichment                   |
| `npm run cluster`            | Run pgvector semantic clustering pass over unassigned articles          |
| `npm run scan-topics`        | Run surveillance scanners across all active Locked Topics               |
| `npm run backlog`            | Enrich queued/unprocessed articles in batch                             |
| `npm run worker`             | Launch 24/7 autonomous `pg-boss` background scheduler daemon            |
| `npm run db:drop-indexes`    | Temporarily drop custom HNSW indexes before running Prisma migrations   |
| `npm run db:restore-indexes` | Restore custom pgvector HNSW cosine indexes after migration             |

---

## 🚢 Deployment Topology

The application is deployed across **two core services**:

1. **Frontend Web Service (Next.js 16)**:
   - Hosted on **Vercel** or **Railway**.
   - Builds static PPR shells with on-demand ISR revalidation via `REVALIDATE_SECRET`.
2. **Background Worker Daemon (`masterWorker.js`)**:
   - Hosted on **Railway**, **Render Worker**, or **VPS PM2**.
   - Runs `npm run worker` to manage scheduled pg-boss jobs (RSS ingestion, clustering, topic scans, notifications).
3. **Database**:
   - Hosted on **Supabase** (PostgreSQL + pgvector).

---

## ⚖️ Core Philosophy

- **Perspective Transparency**: Bias and political leanings are labeled for user insight, never censored or automatically altered.
- **Investigation Over Aggregation**: The system behaves as an autonomous research analyst rather than a passive feed reader.
- **Resilient Multi-Provider Orchestration**: Graceful degradation across AI providers ensures zero downtime during upstream API rate limits.
