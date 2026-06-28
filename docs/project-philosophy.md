# Architectural Philosophy: Global News Aggregator

## 1. Core Identity

This is a **general news aggregator** with **scoped ingestion** — it does not attempt to ingest everything on the internet. Instead, it focuses on high-signal news across 10 categories (plus a catch-all). There is no target demographic; the platform is designed to be useful for anyone who wants meaningful insight from their daily news.

The core question the platform answers is not just "what happened?" but **"what insight can we extract from what happened?"**

## 2. Views, Not Silos

The backend ingests broadly across all categories without pre-sorting for any specific audience. The data layer is unified.

The frontend lets each user shape their own view — choosing which categories matter, which sources to follow, and how the feed surfaces articles. Future interest signals (usage tracking, feedback) will further personalize the experience.

The data is not siloed for specific demographics. Every user sees the same pool of articles, filtered by their own preferences.

## 3. Scoped Ingestion

The system does not crawl the open web indiscriminately. It ingests from a curated list of feed sources, each tagged with metadata (country, bias, type, coverage scope). This scoped approach ensures signal quality and enables the AI to provide meaningful cross-source analysis.

Articles are classified into one of 10 core categories (plus a catch-all):

`geopolitics`, `economy`, `business`, `technology`, `environment`, `security`, `politics`, `society`, `bangladesh`, `sports`, `other`

No new categories will be added. New topics are folded into existing categories via the gazetteer.

## 4. The Insight Engine

The pipeline has two stages, both in Node.js:

**Stage 1 — Gazetteer (Deterministic)**
A regex-based classifier that matches articles against weighted keywords and exclusion rules. It determines:
- Category (which bucket the article belongs to)
- Region (where the event takes place — optional, defaults to "Global" if no match)

Region is extracted by Stage 1, not by AI. It is not forced — articles without a clear region match will use "Global".

**Stage 2 — AI Enrichment (LLM)**
Each article is sent through an LLM (Mistral or Groq) that extracts:
- Entities (people, organizations, locations, events)
- Sentiment score (tone polarity from -1.0 to 1.0)
- Bias note (how the article frames the story, what language choices reveal)

The insight methodology is category-appropriate:
- A geopolitics article gets analyzed for strategic interests and power dynamics
- A business article gets analyzed for corporate strategy and market forces
- A technology article gets analyzed for innovation vectors and control of infrastructure
- A politics article gets analyzed for governance trends and domestic power shifts
- An environment article gets analyzed for policy impacts and resource competition
- A security article gets analyzed for threat posture and defense dynamics
- A society article gets analyzed for cultural currents and social movements

The common thread across all categories: surfacing the **structural dynamics and meaningful patterns** behind the news, not just summarizing what happened.

## 5. Article Surfacing & Presentation

The front page presents articles based on user interest signals. This is not a static firehose — future features will incorporate:

- Category preferences (which categories to show)
- Source preferences (which sources to prioritize or hide)
- Usage patterns (what the user reads, what they skip)
- Feedback signals (upvotes, saves, dismissals)

"What's happening today" is one presentation mode among several. Users can also view stories (clusters), locked topics (surveillance topics), and a dedicated chat interface for deep-dive analysis.

See Settings → Feed Preferences for current controls.

## 6. Category Architecture (Locked)

The 10 core categories are final. No new categories. Edge cases are folded based on the nature of the event:

- Applied science / medical breakthroughs → `technology`
- High-profile justice → actor determines category (state → politics, corporate → business, international → geopolitics)
- Natural disasters → `environment`
- Man-made disasters / pandemics → `security` or `society`

This folding is configured through `gazetteer.json` weights and exclusions, not through code changes.

## 7. Directive

- Do not add new categories
- Fold new topics into existing categories by updating `gazetteer.json`
- Keep the pipeline deterministic first, AI-assisted second
- Prioritize signal quality over ingestion volume
