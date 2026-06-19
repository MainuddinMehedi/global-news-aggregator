# Locked Topics: V2 Architecture & Core Reasoning

> **Purpose:** This document synthesizes the architectural vision for Locked Topics v2. It explains *why* the system must evolve from a simple scraper into an intelligence-augmented research agent, and *how* we plan to achieve that without exploding LLM costs.

---

## 1. The Fundamental Shift
**Current Reality (v1):** Locked Topics is a scheduled scraper. It grabs raw findings based on keyword matching and throws every single finding at a premium LLM (Groq) for scoring. It treats all sources equally and deduplicates only by exact URL.
**Desired Future (v2):** A persistent, user-intent-driven research agent. It monitors heterogeneous sources, filters cheaply before using expensive AI, learns from user feedback, and builds structured "Story Clusters" out of raw findings.

---

## 2. Tiered Relevance (The Cost & Scale Solution)
Throwing every finding at a premium LLM scales poorly ($$$). v2 mirrors the main ingestion pipeline by introducing a strict filtration cascade, reducing costs by 10-16x.

1. **Tier 0 (Deterministic Filter - Zero Cost):**
   - Matches against gazetteer entities, category scopes, boolean ASTs, and pre-computed semantic embeddings.
   - *Outcome:* Discards ~80-90% of pure noise instantly.
2. **Tier 1 (Cheap LLM Classifier - ~$0.0001/req):**
   - Uses a fast model (e.g., Llama 3 8B or Gemini Flash) for a basic `HIGH / MEDIUM / LOW` classification.
3. **Tier 2 (Rich LLM Analysis - ~$0.001/req):**
   - Uses the premium model *only* on the top 5% of findings (Tier 1 `HIGH` passes) to extract entities, sentiment, and generate notification-ready summaries.

---

## 3. Multi-Level Deduplication & Clustering
Currently, if the exact same event is reported by Reuters, AP, and a Reddit post with different URLs, the system creates three separate findings. v2 introduces a 4-layer cascade:

1. **Layer 1 (URL Exact Match):** Hard duplicate → Discard.
2. **Layer 2 (Content Hash):** SHA-256 of title+summary for syndicated copies → Keep the highest relevance, link as a variant.
3. **Layer 3 (Simhash):** 64-bit fingerprint for near-duplicates (different wording, same meaning) → Group together.
4. **Layer 4 (Entity Fingerprint):** Same entities + region + time window → Creates a cross-source **Story Cluster** within the topic (e.g., grouping the Reuters article and the Reddit post under one event node).

---

## 4. Adaptive Source Orchestration
Instead of blindly scanning every static source every 2 hours, v2 tracks **Source Health**:
- Metrics tracked: Success rate, latency, uniqueness contribution, and user feedback ratio.
- Sources with high uniqueness and positive feedback are prioritized.
- Sources with 3+ consecutive failures degrade gracefully and pause.
- **Search Driver Shift:** Move away from Brave API (paid/rate-limited) as the primary engine. Use DuckDuckGo HTML scraping as the free primary, with Brave as a circuit-breaker fallback for structured data.

---

## 5. The Feedback & Learning Loop
A tracking agent must learn what the user actually wants. v2 introduces continuous query refinement:
- **Implicit Signals:** Reads (+1), Bookmarks (+3), Ignored (-1).
- **Explicit Signals:** A new "Not Relevant" UI button (-5).
- **Periodic Refinement:** Once a month (or after 50 findings), an AI reviews the top-performing findings vs. the negative feedback, and proposes a new, improved Boolean AST + conceptual keyword set. The user approves the shift, and the system re-scores historical findings.

---

## 6. How to Go About Implementation (Phased Strategy)
Do not build this all at once. The migration path:
1. **Foundation First:** Centralize scanner configs, standardize return types, and add the necessary schema fields (`simhash`, `contentHash`, `TopicStoryCluster`) without breaking the v1 flow.
2. **Tiered Relevance:** Build the Tier 0 deterministic filters and wire up the cheap Tier 1 classifier. This stops the API cost bleed immediately.
3. **Deduplication:** Implement the 4-layer cascade in the scanner pipeline.
4. **Learning & Feedback:** Finally, introduce the UI feedback buttons and the periodic AI query refinement job.
