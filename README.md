# 🗺️ Global News Aggregator

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)

> **Multi-perspective news intelligence, synthesized by AI — your personal investigative researcher for global events.**

**Version**: 1.6 | **Status**: 🚧 Phase 3/3 (Locked Topics Surveillance Complete)

---

## 🎯 Project Goals

- **Aggregate** multi-perspective news from diverse global sources (Western, Non-Western, and Local).
- **Categorize & Synthesize** articles with AI (Groq/Llama) to extract sentiment, bias, and story dossiers.
- **Persistent Surveillance**: Lock specific topics (geopolitics, career, niche interests) for 24/7 background monitoring.
- **AI-Refined Tracking**: Turn vague intents into structured surveillance queries using automated AI refinement.
- **Maintain Evolving Dossiers**: Dynamically cluster related articles into unified story threads with live impact scores.
- **Display Bias transparently**: Perspective badges for informational transparency, not automated correction.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    UI["🖥️ Next.js Frontend\n- Story Clusters\n- Locked Topics Dashboard\n- 4-Step Creation Wizard\n- Global Stats Sync"]
    DB[("🗄️ PostgreSQL (Supabase)\n- Articles & Clusters\n- Locked Topics & Findings\n- Shared Prisma Schema")]
    Worker["⚙️ Node.js Ingestion Service\n1. Multi-source RSS Fetch\n2. AI Article Enrichment\n3. Story Clustering Pass\n4. Surveillance Scanning\n5. Cache Revalidation"]

    UI <-->|"Next.js Server Components"| DB
    Worker -->|"Automated Scans"| DB
    Worker -->|"On-demand Revalidate"| UI
```

---

## ✨ Key Features

### 📰 Intelligent Ingestion
- Multi-source RSS/API fetching with async generators.
- Two-layer deduplication: normalized URL + SHA-256 content hash fallback.
- Sliding-window rate limiter tailored for strict TPM/RPM AI budgets.

### 🧠 AI-Powered Surveillance (Locked Topics)
- **Locked Topics**: Define an investigative interest and let AI refine the query for precision.
- **Automated Scanning**: New articles are automatically matched against your "locked" interests during ingestion.
- **Multi-Tier Scanners & Scrapers**: API-based scanners (GitHub, YouTube, Brave) and HTML scrapers (Webpage Diffs, BD Gov Jobs, Company Careers) work together for high coverage.
- **Live Intelligence Summary**: Brave's native AI search synthesis provides live situational awareness on every topic dashboard.
- **Historical Archival**: Topics can be archived with a final, Gemini-generated historical summary to save space while keeping intelligence records.

### 🛡️ Story Dossiers
- Evolving clusters that automatically merge timelines, update impact scores, and track active lifecycles.
- **Why It Matters**: AI-generated context on the global significance of a story.

---

## 📁 Project Structure

```
global-news-aggregator/
├── frontend/                     # Next.js 16 App Router UI
│   ├── app/
│   │   ├── locked-topics/        # Investigative dashboard & trackers
│   │   └── stories/              # Story cluster timelines
│   ├── components/
│   │   ├── Feed/                 # Core article stream
│   │   └── locked-topics/        # 4-Step Creation Wizard, Grid & Detail Views
│   ├── store/                    # Zustand (Articles, Stories, Topics)
│   └── queries/                  # Cached Server Actions (Next.js 16)
├── ingestion-service/            # Node.js streaming pipeline
│   ├── db/prisma.js              # Shared DB client (Self-contained)
│   ├── ai/
│   │   ├── processor.js          # Ingestion + Surveillance logic
│   │   └── client.js             # AI Prompting & Refinement
│   ├── topics/
│   │   ├── sources/              # Individual Scanners (API) & Scrapers (HTML)
│   │   ├── scanner.js            # Master orchestrator for topics
│   │   ├── scorer.js             # AI relevance scoring module
│   │   └── notifier.js           # Discord & Telegram alerts
│   ├── processTopics.js          # Scheduled background scanner
│   └── index.js                  # Main orchestrator
└── prisma/
    └── schema.prisma             # Unified Data Model
```

---

## 🚀 Quick Start

**1. Set up environment**
```bash
cp .env.example .env
# Sync to frontend
cp .env frontend/.env.local
```
*Configure `DATABASE_URL` (Supabase) and `AI_PRIMARY_API_KEY` (Groq).*

**2. Initialize database**
```bash
npx prisma migrate dev
```

**3. Run the pipeline**
```bash
# In Root:
npm run ingest

# In Frontend:
cd frontend && npm run dev
```

---

## 🤝 Philosophy
- **Perspective Transparency**: Bias detection is for the user to interpret, not for the system to hide.
- **Investigation First**: The system acts as a persistent researcher, not just a passive reader.
- **Performance**: High-concurrency server-side caching with explicit revalidation.

