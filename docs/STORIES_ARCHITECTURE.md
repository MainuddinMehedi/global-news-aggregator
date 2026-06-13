# Story Clusters Architecture

This document outlines the end-to-end architecture and lifecycle of "Story Clusters" in the Global News Aggregator. 

## 1. What is a Story?
While the Article Feed provides a raw firehose of individual news pieces, the **Stories View** acts as a curated "Global Billboard" of the top 30 most pressing, evolving narratives in the world. 
It groups redundant or related reporting into a single evolving entity, providing an AI-generated summary of key developments and global perspectives.

## 2. Decoupled Pipeline Architecture
To prevent API rate limits, network crashes, and LLM amnesia, the system is split into two asynchronous phases: Ingestion and Clustering.

### Phase 1: Ingestion & The Holding Tank (Every ~15 Mins)
1. `npm run ingest` fetches new articles from RSS feeds.
2. A fast, local Python microservice (`enrichment-service`) performs NLP:
   - Extracts geopolitical entities (PERSON, ORG, GPE, LOC) using spaCy.
   - Calculates sentiment scores.
3. Articles are saved to the database as `ProcessedArticle` with `clusterStatus = "HOLDING"`.
4. **Zero LLM tokens are used in this phase.**

### Phase 2: The Clustering Worker (Every ~1 Hour)
1. `npm run cluster` wakes up.
2. **Entity Cross-Verification:** The script queries all `HOLDING` articles from the last 48 hours. It groups articles that share at least **2 identical entities** (e.g., both mention "Emmanuel Macron" and "Paris").
3. **Critical Mass:** If an entity group reaches **3 or more articles**, it achieves "Critical Mass". 
4. **Token Batching:** The overlapping articles are sliced into fixed chunks of 5 (`chunk_size = 5`). This conservative batch size ensures that even with the Top 30 Active Stories injected as context, the prompt stays safely within the constraints of the fallback model's lower 12K TPM limit, while leaving plenty of headroom for the primary model's 30K TPM limit.
5. **Context Fetching:** The script queries the database for the **Top 30 Active Stories** (ranked by momentum) to use as the "Global Billboard" context.
6. **The LLM Decision:** Groq is prompted with the Top 30 summaries and the batch of 5 new articles. It is asked: *"Do these new articles belong to an existing active story, or should we create a brand new one?"*
7. **Database Updates:** The database is updated with new clusters, linked articles, and updated summaries. Articles are marked as `clusterStatus = "CLUSTERED"`.

## 3. The Lifecycle of a Story

### Story Statuses
Stories are not just "Active" or "Inactive". They follow a lifecycle:
- 🚨 **EMERGING:** A sudden spike in coverage.
- 📈 **DEVELOPING:** Sustained, high-volume daily reporting.
- 🐢 **SLOW BURN:** Low volume, but continuous long-term relevance.
- 🧊 **COOLING:** Media attention is dying off.
- 🗄️ **ARCHIVED:** The event has concluded. Removed from the UI and active context.

### Momentum Decay & The Active Cap
To prevent the LLM context from blowing up, there is a hard cap of **30 Active Stories** globally.
- Every story has a `momentumScore`.
- Adding new articles to a story heavily increases its momentum.
- Every hour, the `runClustering.js` script naturally decays the momentum of all active stories.
- If a story's momentum drops to zero, it auto-archives.
- If a 31st active story is created, the system forces the "coldest" active story into the `ARCHIVED` state to make room. This ensures only the most critical global events occupy the active space.

## 4. Why This Architecture?
- **No Token Waste:** Isolated, minor news events sit in the Holding Tank. If they never find 2 other matching articles within 48 hours, they are archived without ever hitting the LLM.
- **Perfect Context:** By holding articles and batching them based on entity overlap, the LLM is guaranteed to see the full scope of a developing event in a single prompt, preventing "LLM Amnesia".
- **API Safety:** Separating the fast ingestion from the slow clustering ensures that rate limits or network failures during the Groq API call never orphan or lose ingested articles.
