# Enrichment Pipeline Overview

The Enrichment Pipeline is responsible for processing raw news articles, extracting structural metadata, and running Natural Language Processing (NLP) models to derive deeper insights (like sentiment and named entities). This happens asynchronously during the ingestion phase before the article is clustered into broader geopolitical narratives.

## Architecture & Data Flow

The enrichment process is split into two distinct stages managed by an AI Processor (`ingestion-service/ai/processor.js`). The Processor buffers raw articles and flushes them in batches (fixed at 30 items) to protect system limits.

### Stage 1: Deterministic Enrichment (Local JavaScript)
This stage is fast, deterministic, and rule-based. It runs locally within the Node.js ingestion worker.
- **Location**: `ingestion-service/ai/stage1.js`
- **Responsibilities**:
  - **Categorization**: Uses a gazetteer (`CATEGORY_KEYWORDS`) to match keywords and assign a primary category.
  - **Region Extraction**: Uses regional keywords (`REGION_KEYWORDS`) to assign an `eventRegion`. Falls back to the source's origin if no region is detected in the text.
  - **Inherited Bias**: Copies static identity metadata (`biasGroup`) from the original feed definition to the article's `biasNote`. (Note: `perspectiveCountries` was removed in favor of using `rawArticle.sourceCountry` directly).

### Stage 2: NLP/ML Enrichment (Python Microservice)
This stage relies on a separate Python-based FastAPI microservice for heavier Natural Language Processing tasks. It is invoked over HTTP in batches.
- **Location (Client)**: `ingestion-service/ai/stage2.js`
- **Location (Server)**: `enrichment-service/main.py`
- **Responsibilities**:
  - **Named Entity Recognition (NER)**: Uses `spacy` (`en_core_web_sm`) to extract `PERSON`, `ORG`, `GPE` (Geopolitical Entities), and `LOC` (Locations). It deduplicates and returns a maximum of 15 entities to prevent database bloat.
  - **Sentiment Analysis**: Uses `vaderSentiment` to calculate a compound polarity score between `-1` (most extreme negative) and `+1` (most extreme positive).
- **Resilience**: If the Python microservice is down, the client (`stage2.js`) gracefully degrades, assigning empty entities and a `null` sentiment score to allow ingestion to continue uninterrupted.

## Transaction & Post-Processing
After both stages complete, the Processor merges the results. 
1. **Database Commit**: It uses a Prisma transaction (`ingestion-service/ai/processor.js`) to save the `ProcessedArticle`. This includes sequential processing with `connectOrCreate` operations for categories to prevent unique constraint race conditions.
2. **Realtime Matching**: Newly enriched articles are passed to `scanLockedTopicsRealtime` (`ingestion-service/topics/realtimeMatcher.js`) to see if they match any user-defined "Locked Topics" for immediate tracking.

## Technical Limits & Tradeoffs
- **Batching Strategy**: A fixed batch size of 30 protects the `enrichment-service` from running out of memory (specifically tailored for 512MB RAM constraints on the microservice), while completely avoiding the overhead of LLM token-counting.
- **Microservice Decoupling**: By moving NLP (SpaCy/VADER) to a dedicated Python service (`enrichment-service/main.py`), the Node.js ingestion pipeline remains lightweight, and the heavy ML dependencies can scale or be deployed independently.
