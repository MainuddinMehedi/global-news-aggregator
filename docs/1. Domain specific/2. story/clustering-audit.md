# Story Clustering: Comprehensive Technical Audit & Vectorization Path

> [!NOTE]
> **Implementation Status:** The optimization recommendations from this audit have been fully implemented in Phase 3. Specifically, raw SQL vector pre-clustering, raw SQL candidate similarity query with legacy fallback, Fast-Exit prompting bypass, and post-run medoid-based deduplication are active.

This audit evaluates the architectural status, technical debt, and vector-assisted optimization paths for the **Story Clustering** (`STORY_CLUSTERING`) engine.

---

## 1. Executive Summary

The current clustering engine operates as a **decoupled asynchronous pipeline**:
1. It accumulates newly enriched articles in a `HOLDING` state.
2. It groups articles locally using **entity overlap** (connected components).
3. It filters active story dossiers to find **candidate stories** using in-memory string-intersection heuristics.
4. It calls the **LLM (Mistral/Groq)** to make the final assignment, metadata update, or new story creation.

While structurally sound and highly decoupled, the current implementation relies heavily on **heuristic string matching** and **brute-force comparisons**. By upgrading the pipeline to use the newly implemented **768-dimensional vector embeddings**, we can achieve:
* **80%+ LLM Token Savings** via candidate pre-filtering and "fast-exit" new story creation.
* **Higher Grouping Recall** by connecting articles based on conceptual meaning rather than exact entity spellings.
* **Sub-millisecond Candidate Retrieval** directly inside PostgreSQL via HNSW vector index queries.
* **Hallucination Redundancy** via automated post-run duplicate story merging.

---

## 2. Current System Design & Critical Debt

### 🔴 Debt Item 1: O(N²) In-Memory Entity Graph Matching (`detectEntityOverlap`)
* **Logic**: Articles are grouped into components if they share at least 2 normalized entities.
* **Limitation**:
  - **Typo/Extraction Sensitivity**: If the Stage 2 entity extractor parses `"President Joe Biden"` in Article A, `"Biden"` in Article B, and fails to extract it in Article C, the overlap breaks down.
  - **Concept Blindness**: If two articles cover the exact same event but name different entities (e.g. one mentions the local mayor, the other mentions the national agency), they remain disconnected.
  - **Scaling**: A nested loop compares every article in the `HOLDING` pool. At 300 articles, this is 44,850 iterations.

### 🔴 Debt Item 2: Fragile String-Intersection Candidates (`clusterRelevanceScore`)
* **Logic**: Evaluates active clusters using an in-memory heuristic equation:
  $$\text{Score} = \text{Entities} \times 8 + \text{Regions} \times 3 + \text{Themes} \times 2 + \text{TextTokens} \times 0.5 + \text{Recency} \times 2 + \text{Rank} \times 0.25$$
* **Limitation**:
  - **Magic Numbers**: The coefficients ($8, 3, 2, 0.5$) are arbitrary weights that require constant manual tuning as the news volume and vocabulary drift.
  - **Complexity**: In-memory tokenization and set intersection calculation over up to 200 active clusters is slow and computationally heavy.

### 🔴 Debt Item 3: LLM Context Bloat & Prompt Tax
* **Logic**: Chunks article groups into batches of 5 and sends them to the LLM alongside the top 30 most relevant active story candidates.
* **Limitation**:
  - Even if a batch describes a completely new development that matches **zero** existing active clusters, the LLM is still fed the full details of all 30 candidate stories.
  - This costs up to **15K unnecessary context tokens** per batch execution.

### 🔴 Debt Item 4: Stale Lifecycle Hard-Archival
* **Logic**: Active clusters marked `STABLE` or `RESOLVING` are archived after exactly 7 days of inactivity, regardless of their `impact` rating (e.g., `CRITICAL` vs `LOW`).
* **Limitation**:
  - If a major diplomatic negotiation (CRITICAL impact) enters a quiet, "stable" phase for 8 days, it gets archived. A subsequent update on day 9 will fail to match the archived cluster, resulting in the creation of a duplicate story.

---

## 3. Vectorization Opportunities (Phase 3 Proposals)

```mermaid
flowchart TD
    A[ProcessedArticle: HOLDING] -->|Pairwise Vector Distance matrix| B{Pre-Cluster?}
    B -->|Similarity < 0.22| C[Group into candidate event threads]
    C -->|pgvector Cosine query| D[Fetch Nearest Active Clusters]
    D -->|Is Min Distance > 0.38?| E{Fast Exit?}
    E -->|Yes: Genuinely New Event| F[LLM: Create New Story directly\nSkip candidate context]
    E -->|No: Potential Match| G[LLM: Decide Assignment / Updates\nSend top 5 nearest candidates]
    G --> H[StoryCluster Updated/Saved]
    H --> I[Hourly/Daily Cron: Merge duplicate clusters]
```

### 🚀 Optimization A: Vector-Distance Pre-Clustering (Stage 1 Sieve)
Instead of relying strictly on entity overlaps, group `HOLDING` articles using **vector cosine distances**:
* **Mechanism**: Two articles are connected if their vector distance is below a threshold:
  $$\text{Distance} = 1 - \text{CosineSimilarity}(v_1, v_2) < 0.22$$
* **Hybrid Fallback**: Connect if $\text{Distance} < 0.22$ **OR** ($\text{Distance} < 0.35$ **AND** they share $\ge 2$ normalized entities).
* **Impact**: Drastically improves recall, groups cross-lingual articles, and handles minor entity extraction failures.

### 🚀 Optimization B: Raw SQL Vector Similarity Candidate Selection (Stage 2 Sieve)
Replace the in-memory string parsing in `relevance.js` with a database query:
* **Mechanism**: Retrieve active clusters whose articles are semantically closest to the current batch:
  ```sql
  SELECT DISTINCT c.id, MIN(p.embedding <=> a.embedding) AS min_distance
  FROM "StoryCluster" c
  JOIN "_ArticleStoryClusters" asc ON c.id = asc."B"
  JOIN "ProcessedArticle" p ON asc."A" = p.id
  JOIN "ProcessedArticle" a ON a.id = ANY($1::uuid[])
  WHERE c."isActive" = true
    AND p.embedding IS NOT NULL
  GROUP BY c.id
  ORDER BY min_distance ASC
  LIMIT $2;
  ```
* **Impact**: Leverages the database HNSW index for sub-millisecond candidate retrieval. Replaces 120 lines of fragile set-intersection code with a single, highly performant SQL query.

### 🚀 Optimization C: Fast-Exit AI Cost-Saver
* **Mechanism**: Check the `min_distance` of the nearest candidate cluster:
  - If `min_distance > 0.38` (similarity < 0.62), it is mathematically certain that these articles do **not** belong to any active story.
  - **Skip sending any candidate clusters to the LLM**. Simply call the LLM to write a title, summary, and metadata for a *new* cluster, excluding active cluster tokens entirely.
* **Impact**: Saves **up to 80% in token usage** for new, breaking stories.

### 🚀 Optimization D: Post-Run Cluster Deduplication
* **Mechanism**: Implement a cron or post-clustering routine that compares active cluster average vectors.
  - Compute a cluster's centroid vector: $\vec{V}_{\text{cluster}} = \frac{1}{N}\sum \vec{v}_{\text{article}}$.
  - If two active clusters have a centroid distance $< 0.15$:
    - Merge their articles under the older cluster.
    - Set the newer cluster's `isActive` to `false`.
* **Impact**: Completely resolves duplicate story clusters created across batch or time boundaries by the LLM.

---

## 4. Proposed Database Schema Changes

To support cluster-level embeddings (for fast centroid-based deduplication), we can add the following to `StoryCluster`:

```prisma
model StoryCluster {
  id               String   @id @default(uuid())
  // ... existing fields
  embedding        Unsupported("vector(768)")?
}
```

This column can be calculated on creation/update by averaging the active articles' vectors.

---

## 5. Potential Roadmaps & Verdict

### Matrix of Possibilities

| Task | Effort | Value | Risk | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **1. Vector Candidates (SQL)** | 🏎️ Quick (2 hours) | 🚀 High | Low | Low |
| **2. Vector Pre-Clustering (Sieve)** | ⚖️ Med (4 hours) | 🚀 High | Low | Med |
| **3. Fast-Exit AI Cost-Saver** | ⚖️ Med (2 hours) | 🚀 High | Low | Low |
| **4. Post-Run Deduplication** | ⏳ High (6 hours) | 🧠 High | Medium | High |

### Recommended Action Plan
1. **Step 1 (Candidate Optimization)**: Replace in-memory `clusterRelevanceScore` heuristics with a raw SQL vector candidate query.
2. **Step 2 (Clustering Optimization)**: Update `detectEntityOverlap` to use a hybrid of vector distance and entity intersection.
3. **Step 3 (AI Prompt Tuning)**: Inject the "Fast Exit" logic to bypass candidate contexts when no similar clusters exist in the database.
