# Global News Aggregator — Documentation Index

This index serves as a mindmap and entry point to understand the project's documentation. The project is split into the Next.js frontend and the Node.js ESM ingestion service. The documents below outline the architecture, data models, and features.

## 🏗️ Architecture & Core Features
- **[Story Feature Overview](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/STORY_FEATURE.md)**
  High-level breakdown of the evolving "Story Cluster" feature, explaining how individual articles are grouped into geopolitical narratives.
- **[Stories Architecture (Technical)](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/STORIES_ARCHITECTURE.md)**
  Deep dive into the clustering architecture: how the worker tracks "HOLDING" articles, achieves critical mass, batches LLM requests safely, and decays cluster momentum.
- **[Locked Topics Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/locked-topics-implementation-guide.md)**
  Documentation for the user-configurable semantic "Topics" feature that strictly filters incoming news against custom user intents using local search and AI relevance scoring.

## 🧠 AI & Models
- **[AI Models Strategy](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/AI_MODELS.md)**
  The definitive guide to model assignments across the stack, detailing exactly which models (Groq Llama vs Google AI Studio) are used for which tasks to optimize speed, intelligence, and cost.

## 🏷️ Metadata & Enrichment Pipeline
- **[Metadata Strategy Overview](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/METADATA_STRATEGY_OVERVIEW.md)**
  How raw news articles are enriched with structured metadata (Entities, Categories, Sentiment, Perspective Countries).
- **[Enrichment Pipeline Alternatives](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/ENRICHMENT_PIPELINE_ALTERNATIVES.md)**
  Exploration of alternative techniques for processing pipeline architecture, specifically around Local ML vs Cloud LLM tradeoffs.
- **[Metadata Audit & Curation](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/METADATA_AUDIT_AND_CURATION.md)**
  How metadata is audited and validated before making it to the frontend.
- **[Metadata Development Log](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/METADATA_DEVELOPMENT_LOG.md)**
  Historical context and iterations of the metadata schema.

## 🚀 Project State & Ops
- **[Project State](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/project_state.md)**
  Current state of the project, including known limitations, recent architectural migrations, and system health notes.
- **[GitHub Actions Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/GITHUB_ACTIONS_GUIDE.md)**
  Documentation for the CI/CD pipeline and automated workflows.
- **[Project Roadmap](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/PROJECT_ROADMAP.md)**
  Upcoming features, scaling plans, and pending technical debt.

## 📜 Historical Logs
- **[Phase 0](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/phase-0.md)**
  Initial MVP requirements and foundational project setup.
- **[Chat Analysis & Implementation Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/chat_analysis_and_implementation_guide.md)**
  Notes and transcripts from core architectural decision phases.
- **[Clustering Foundation Fixes](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/clustering_foundation_fixes.md)**
  Dev log capturing the decoupling of clustering from ingestion and rate limiting fixes.
