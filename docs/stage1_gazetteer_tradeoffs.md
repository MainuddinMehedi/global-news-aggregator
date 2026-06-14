# Stage 1 Gazetteer vs. Local ML Classifier: Trade-off Matrix

## Context & Problem Statement
During the ingestion phase, raw RSS articles need to be categorized (e.g., geopolitics, economy, lifestyle) and region-tagged before they are sent to the heavy Natural Language Processing (NLP) pipeline (Stage 2). 
Initially, we used a naive `.includes()` array check in Node.js, which resulted in severe substring bleeding (e.g., "us" matching the letters inside "house", triggering "North America" and "geopolitics" incorrectly).

We evaluated two architectural paths to fix this:
1. **Regex-Compiled Gazetteer (The chosen path):** Upgrading the arrays into compiled Regular Expressions with strict word boundaries (`\b`).
2. **Local ML Classifier:** Using a lightweight semantic classification model (e.g., fastText or a small ONNX model) to predict categories.

## Falsifiability Trade-off Matrix

| Vector | Regex Gazetteer (Chosen) | Local ML Classifier (Disproven) |
| :--- | :--- | :--- |
| **Efficacy & Determinism** | 100% predictable. If the word exists, it matches. We eliminated substring bleeding via word boundaries (`\b`). It lacks semantic understanding (e.g., it will miss "lawmakers" if only "congress" is in the list). | High semantic understanding, but introduces a "black box." It might miscategorize articles unpredictably, and debugging *why* it failed is difficult. |
| **Operational Overhead** | ~0MB RAM. Executes in microseconds per article. Guarantees the Node.js event loop will never block, which is essential for a high-volume streaming ingest worker. | Requires loading a model into memory (50MB+). Inference adds milliseconds to the event loop. Node.js is not optimized for synchronous ML execution without worker threads. |
| **Maintenance (Debt)** | High manual maintenance. The dictionary (`gazetteer.js`) must be manually updated as news trends evolve (e.g., adding new leaders or geopolitical events). | Low manual maintenance. The model infers synonyms automatically. However, retraining the model if the schema changes is a heavy engineering tax. |
| **Scope Realism** | Perfect fit. Stage 1 acts purely as a "Sieve" to drop irrelevant articles (`other`) and pass canonical categories to Stage 2. It requires zero API calls and costs nothing. | Over-engineered for a simple routing Sieve. The heavy NLP analysis (entities, sentiment) is already handled downstream in Stage 2. |

## The "Sieve" Routing Logic
Based on this decision, Stage 1 acts as a strict gatekeeper:
*   Any article that maps to a canonical category (e.g., `geopolitics`, `sports`, `economy`) is kept and sent to Stage 2. We keep soft news (like sports/entertainment) because they carry geopolitical relevance regarding "soft power" and cultural influence.
*   Any article that fails to match a keyword is labeled as `other` and **dropped entirely** from the `ProcessedArticle` pipeline to prevent database bloat. 
*   This protects the Stage 2 Python ML service (spaCy) from processing irrelevant junk.
