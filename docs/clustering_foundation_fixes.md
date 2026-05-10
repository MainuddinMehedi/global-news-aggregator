# Clustering Foundation — Architectural Fixes & Decision Patterns

This document summarizes the six foundational fixes applied to the ingestion and clustering pipeline. It highlights the architectural **decision patterns** used to resolve the issues, serving as a guide for future implementations across the project.

## Core Architectural Decision Patterns

### 1. Data Integrity via Code, Not AI Magic
**What we chose:** Deterministic merging and database constraints in the codebase.
**Over what:** Asking the AI to perfectly reproduce existing state.
**Why:** LLMs are great at analyzing new information but terrible at perfectly copying old information without slight rephrasings or omissions. 
*   **Example (Fix 2):** We stopped asking the AI to return the *entire* `keyDevelopments` array. Instead, we instructed it to return *only* new developments (a diff) and used our existing `mergeKeyDevelopments` logic to append them. 
*   **Example (Fix 1):** We stopped relying on a random 5-character string to always be unique. We added a deterministic DB check (`findUnique` on the slug) before insertion to prevent silent constraint failures and data loss.

### 2. Decouple Heavy Passes from Fast Passes
**What we chose:** Accumulating processed data and running heavy AI passes at the end of the pipeline.
**Over what:** Running heavy AI passes synchronously inside every micro-batch.
**Why:** Coupling heavy operations (clustering with 30-60 context objects) to fast operations (article categorization in batches of 5) creates a massive bottleneck and explodes API costs/rate limits at volume.
*   **Example (Fix 4):** We decoupled the clustering pass from the article analysis batch loop. The pipeline now fully categorizes/analyzes *all* articles in a run first, buffers them, and then runs a dedicated clustering pass across the accumulated buffer.

### 3. State Awareness via In-Memory Mutation
**What we chose:** Mutating an in-memory snapshot of state across sequential batches.
**Over what:** Re-fetching state from the database for every batch, or running batches without awareness of each other.
**Why:** When an AI creates new entities (like Story Clusters) that subsequent batches need to know about, DB replication lag or batch race conditions can cause duplicates.
*   **Example (Fix 4):** When batch 1 creates a new cluster, it is immediately `unshift`ed into the `activeClusters` array in memory. When batch 2 runs seconds later, it sees that newly created cluster in its prompt and can assign articles to it, preventing duplicate story creation.

### 4. Compute Signals In-Memory vs. Re-querying
**What we chose:** Deriving aggregate signals (counts, top sources) from data we already hold in memory.
**Over what:** Executing individual `findUnique` relation queries for every updated record.
**Why:** The database should be the source of truth, but if we just fetched the relations to build the AI prompt, we don't need to ask the database to count them again.
*   **Example (Fix 5):** Replaced `getClusterSignals` (which ran a DB query per cluster update) with a combined in-memory calculation. We took the existing articles from the `activeClusters` snapshot, appended the new articles assigned in the current batch, and ran `getArticleSignals()` locally.

### 5. Single Source of Truth for Business Rules
**What we chose:** Dynamic injection of environment variables/constants into AI prompts.
**Over what:** Hardcoding business rules in natural language inside the prompt while defining them as constants in the code.
**Why:** When thresholds are hardcoded in the prompt, they inevitably drift from the actual code constants (e.g., the DB deactivates at 30 days, but the prompt says 14 days).
*   **Example (Fix 3):** We added specific lifecycle constants (`CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS`, etc.) and explicitly passed them via a `lifecycleConfig` object into the prompt builder (`${medium} days (MEDIUM)`). 

### 6. Minimal Sufficient Context (Token Efficiency)
**What we chose:** Sending synthesized, summarized data to the AI.
**Over what:** Sending raw, redundant data alongside the summarized data.
**Why:** Every token costs money and context window space. If a cluster's `summary` and `keyDevelopments` were just generated based on its articles, the AI does not also need to read the raw titles of those older articles to understand what the cluster is about.
*   **Example (Fix 6):** We removed the `Recent Articles` list from the `ACTIVE CLUSTERS` block in the prompt, forcing the AI to rely on the dossier summary.

---

## Summary of Applied Fixes

| Fix | Problem | Solution | Pattern Applied |
| :--- | :--- | :--- | :--- |
| **1. Slug Collisions** | Random 5-char suffixes could collide, causing silent data loss on cluster creation. | Added a `findUnique` check before creation; retry with a new suffix if a collision occurs. | #1 (Data Integrity via Code) |
| **2. Key Dev. Merge** | AI rephrased existing key developments, causing duplicates and history corruption. | Changed prompt to request ONLY new developments; merged the result with existing DB state via code. | #1 (Data Integrity via Code) |
| **3. Lifecycle Alignment** | DB deactivated clusters at 30 days, but AI prompt required strong matches after 14 days. | Created distinct constants for Medium/Critical impact and injected them directly into the AI prompt template. | #5 (Single Source of Truth) |
| **4. Decouple Clustering** | Clustering fired every 5 articles, causing massive redundant DB fetches and token bloat. | Moved clustering to a separate pass *after* all articles are processed; batched the clustering calls. | #2 & #3 (Decoupling & State Awareness) |
| **5. In-Memory Signals** | `getClusterSignals` ran a DB query per assigned cluster to recount sources. | Combined in-memory `activeClusters` data with the current batch assignments to calculate counts locally. | #4 (Compute In-Memory) |
| **6. Prompt Cleanup** | Sent `summary` AND `Recent Articles` titles for existing clusters, wasting tokens. | Removed `Recent Articles` from the prompt; removed dead `impactScore ??` code. | #6 (Minimal Sufficient Context) |

*These foundations ensure the ingestion service can scale safely without silent data corruption, preparing the system for the upcoming scheduled Batch Refresher implementation.*
