# Global News Aggregator — Documentation Master Index

This index serves as the entry point and mindmap for the project's documentation. The project is split into the Next.js frontend and the Node.js ESM ingestion service.

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
  Definitive model assignments across the stack, detailing Groq vs. Google AI Studio usage for optimal speed, intelligence, and cost.

---

## 3. Feature Documents (Numbered)

These documents represent the source of truth for each major platform feature. They conform to the standardized outline format and are ordered by logic and data flow.

1. **[1. Ingestion & Enrichment Pipeline](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/1. enrichment-pipeline.md)**  
   The two-stage parsing flow: Stage 1 local Regex Gazetteer sieve and Stage 2 Python FastAPI NLP microservice (GLiNER + VADER).
2. **[2. Story Clustering](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/2. story-clustering.md)**  
   The end-to-end grouping engine that matches geopolitical entities and runs batch LLM categorization to group news articles into stories.
3. **[3. Locked Topics](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/3. locked-topics.md)**  
   The user-defined custom tracking feature that executes multi-source scans (Google News, Brave, Reddit, web scrapers) and rates findings via AI.
4. **[4. Feed, Pagination, & 3-Axis Filtering](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/4. feed-filtering.md)**  
   Cursor-based infinite scroll pagination, URL query syncer, responsive layout grid, and the 3-axis filters (Event Region, Source Origin, Source Type).
5. **[5. Authentication & Role-Based Access Control (RBAC)](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/5. auth-rbac.md)**  
   Session handling via NextAuth.js and Prisma, defining scopes for Public, Authenticated, and Admin users.
6. **[6. Admin Dashboard](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1. features/6. admin-dashboard.md)** _(Planned)_  
   Planned UI controls, settings override tables, and crawler run-telemetry charts.

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
- **[Phase 0 Notes](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/phase-0.md)** — Initial MVP specification logs.
- **[Chat Analysis & Implementation Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/chat_analysis_and_implementation_guide.md)** — Initial architectural feedback and code mapping transcripts.
- **[Clustering Foundation Fixes Log](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/clustering_foundation_fixes.md)** — Details regarding decoupling clustering from the core ingestion sequence.
- **[Rate-Limit-Aware AI Processing Log](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/Rate-Limit-Aware%20AI%20Processing%20&%20Token%20Estimation%20Fix.md)** — Analysis of estimation token adjustments under Groq RPM ceilings.
