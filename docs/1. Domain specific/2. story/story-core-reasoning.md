# Story Clustering: Core Reasoning & Architectural Shifts

> **Purpose:** This document synthesizes the historical research, keynotes, and architectural intents behind the Story Clustering engine. It captures *why* the system works the way it does and what triggered its major shifts.

---

## 1. Core Philosophy: What is a Story?

A **Story** is an evolving, real-world event thread — it is **not** a broad topic, category, or country feed.
- **Good:** `Iran and US resume indirect nuclear negotiations`
- **Bad:** `US politics` or `Donald Trump said something`

**The Framing Model:**
- **Articles** are evidence.
- **Stories** are surfaced event threads.
- **Status** describes the narrative phase (e.g., `DEVELOPING`, `SLOW_BURN`).
- **Impact** controls database retention/lifecycle.
- **Momentum** controls frontend visibility/ranking.

---

## 2. The Great Shift: Decoupling Lifecycle from Ranking

### The Problem with the MVP
The initial implementation tangled multiple concepts together. The biggest flaw was **momentum-based archival**: if a story didn't receive new articles, its momentum dropped to zero and it was automatically archived. 
*The contradiction:* A highly critical geopolitical event (high impact) was being archived simply because the news cycle paused for a few days, destroying the concept of "slow-burn" strategic stories.

### The Architectural Shift
We fundamentally separated the decisions:
1. **Creation:** Should this group of articles become a story? (Driven by entity/region overlap).
2. **Lifecycle (Archival):** Should this story remain active in the database? (Driven by Impact + Status + Inactivity).
3. **Ranking:** How prominent should this story be on the frontend? (Driven by Momentum + Freshness + Source Diversity).
4. **LLM Context:** Which existing stories should the LLM compare new articles against? (Driven by local Relevance Scoring, not global ranking).

*Outcome:* Momentum now only affects what the user sees at the top of the feed. It **never** forcefully archives a story.

---

## 3. How the Engine Works Now (Phase 1)

### Relevance over Global Top 30
Previously, we sent the top 30 global active stories to the LLM for comparison. This broke down as the DB grew.
*Fix:* The system now runs a local **Relevance Score** (comparing entities, regions, and categories) between the new articles and active stories. It only sends the top ~30 *relevant candidates* to the LLM. This saves tokens and keeps context highly accurate.

### Conservative Entity Normalization
Exact string matching missed obvious connections (`Putin` vs `Vladimir Putin`). However, aggressive fuzzy matching (like Levenshtein distance) caused massive false positives (`Georgia` country vs `Georgia` state).
*Fix:* We preserve the original entity strings but compute **normalized comparison keys** using a strict alias dictionary (e.g., `U.S.`, `USA` → `united states`). Broad fuzzy matching is deliberately deferred.

### Narrative Phase vs. Importance
We separated Status from Impact so they can matrix together:
- `LOW Impact` + `STABLE Status` = Archives in a few days.
- `CRITICAL Impact` + `SLOW_BURN Status` = Stays active in the DB for weeks, even if quiet.

---

## 4. The Deliberate Deferrals (Phase 2 Roadmap)

During the rebuild, we explicitly deferred several features to avoid premature complexity. These are the intended "next steps" when the current engine hits its limits:

1. **Hidden Candidate Stories:** Right now, we require 3 overlapping articles to create a story. This misses single-article investigative scoops. *Future:* Add a hidden `CANDIDATE` state for high-impact single articles that wait silently for a confirming second article before surfacing.
2. **Article-Level Themes:** Categories like "Politics" or "World" are too broad. *Future:* Extract granular themes (`sanctions`, `ceasefire`, `election`) at the article level during ingestion to improve relevance scoring.
3. **Post-Run Duplicate Detection:** The LLM sometimes hallucinates duplicate clusters for the same event across batch boundaries. *Future:* Implement a post-run cron job that merges near-identical active stories based on text similarity and shared entities.
4. **Schema Split for `storyType`:** We currently overload `Status` to handle phases like `BREAKING` and `SLOW_BURN`. *Future:* Create a dedicated `storyType` field to cleanly separate the *kind* of story from its current *phase*.
5. **Vector Embeddings (`pgvector`):** *Future:* Replace local text-similarity scoring with semantic embeddings for finding candidate stories, bypassing exact keyword limitations completely.
