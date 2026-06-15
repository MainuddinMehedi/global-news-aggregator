# Architectural Ledger: Ingestion Stage 2 API Migration

This document records the engineering decisions and trade-offs made during the transition of Stage 2 of the Ingestion Pipeline from a local Python microservice (running GLiNER and VADER) to generative LLM APIs.

## 1. Context & The Core Problem

Initially, the ingestion pipeline delegated named entity extraction (NER) and sentiment scoring to a local Python FastAPI microservice:
1.  **Entity Cut-off**: The local spaCy model (`en_core_web_md`) and VADER sentiment analyzer were rule/statistics-based and could not identify newly emerged entities (e.g. "Anthropic" or new political appointments).
2.  **Resource Constraints**: Upgrading to the superior `en_core_web_lg` or zero-shot `GLiNER` model increased local memory consumption beyond the 512MB RAM ceiling on free hosting tiers, triggering Container Out Of Memory (OOM) crashes.
3.  **Monolithic Rate Ceilings**: Routing all Stage 2 requests to Groq (`llama-4-scout-17b`) hit Groq's low **30K TPM** limit, causing ingestion blockages under high-frequency feeds.

---

## 2. Alternatives & Falsification Matrix

We evaluated alternative hosted generative model APIs for Stage 2 enrichment (Entities, Sentiment, BiasNote) and Story Clustering.

| Candidate Model | TPM Limit | RPM Limit | Parameter Size / Tier | Falsification Verdict & Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **`mistral-medium-latest`** | 25K | 49.8 | ~128B class | **Disproven**: The 25K TPM limit means any batch query containing a few news articles (~5K tokens) consumes 20-60% of the entire rolling minute. Chokes immediately under automated queues. |
| **`ministral-3b-2512`** | 1.3M | 750 | 3B class | **Disproven**: While limits are high, a 3B model lacks the semantic depth and reasoning quality to intelligently classify complex geopolitical narratives, turning topic refinement and scoring into "junk." |
| **`mistral-small-2506`** | 2.25M | 300 | 24B class | **Validated (Primary Ingestion/Clustering)**: High quality (24B), structured JSON support, and 2.25M TPM limit. Offers a **75x volume increase** over Groq Scout. |
| **`meta-llama/llama-4-scout-17b`** (Groq) | 30K | 30 | 17B class | **Validated (Secondary Ingestion Fallback)**: Extremely low latency and excellent quality, but restricted by the 30K TPM ceiling. Ideal as a first-line fallback. |
| **`ministral-8b-2512`** | 625K | 187 | 8B class | **Validated (Topic Refinement)**: Balanced speed, low latency, and 625K TPM. Smart enough for interactive prompts without choking. |

---

## 3. Key Design Quirks & Implementations

### Evidence-Based Sentiment & Bias Notes
To mitigate the inherent political leans and RLHF training biases of models, the prompt is explicitly designed to be **evidence-based** rather than **opinion-based**:
*   The LLM does not rate whether an article is "fair" or "biased."
*   Instead, it extracts objective textual observations: **Agency vs. Passivity** of actors, **Loaded Terminology** used, and **Attribution** of actions.
*   The final sentiment score (-1.0 to 1.0) and bias note are computed strictly from these observations.

### Modularity
Prompt construction is fully isolated in `ingestion-service/ai/prompts/enrichment.js`. This prevents logic pollution inside execution workers (`stage2.js` and `processor.js`).

---

## 4. Trajectory Implications

*   **Zero-Cost Local Ingest**: Local servers now run with virtually **0MB local RAM footprint** for AI tasks. This allows the Node ingestion service to run comfortably on micro-instances.
*   **Deprecation of Python Service**: The `enrichment-service/` python folder is officially deprecated and can be safely deleted or ignored in deployment configurations.
*   **Independent Token Pools**: Offloading relevance scoring and ingestion to Mistral preserves Groq quotas exclusively for fast UI topic refinement and fallback tasks.
