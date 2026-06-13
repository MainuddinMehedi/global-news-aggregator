# Ingestion Enrichment Pipeline: Scaling & Alternatives

This document tracks our research and architectural ideation for decoupling the Global News Aggregator's enrichment pipeline from expensive/rate-limited LLM APIs (like Groq or OpenRouter).

*Status:* **Ideation & Research Phase**

---

## 1. The Core Problem
Currently, the pipeline uses an LLM for everything: categorization, entity extraction, sentiment analysis, and perspective detection. 
- **Scale Issue:** As we scale from 10 feeds to 100+ feeds fetching every 30 minutes, we will hit thousands of articles per day.
- **Cost/Rate-Limit Issue:** Even on free/cheap tiers, high volume causes `429 Too Many Requests`.
- **Architectural Flaw:** We are using a sledgehammer (LLMs) to crack a nut (basic Named Entity Recognition and Categorization).

## 2. A Robust, Scalable Architecture Strategy
To build a sustainable geopolitical monitor, we should adopt a **Multi-Stage Enrichment Pipeline**. Articles flow through a series of "gates", starting from the cheapest/fastest, and only reaching the LLM for high-order reasoning.

### Proposed Pipeline Stages

#### Stage 1: Deterministic Enrichment (Zero Cost, Instant)
Instead of asking an AI "What region is this?", we use predefined logic.
- **Source Injection:** The article inherits `biasGroup`, `sourceType`, and `perspectiveCountries` directly from its configuration in `feeds.js`.
- **Keyword/Gazetteer Matching:** We maintain a JSON dictionary of geopolitical keywords.
  - *Example:* If text contains "Fed", "inflation", "GDP", tag `Category: Economy`.
  - *Example:* If text contains "Beijing", "Xi", "Taiwan", tag `eventRegion: Asia-Pacific`.
- *Outcome:* 40-50% of articles are perfectly categorized without ML.

#### Stage 2: Local Lightweight ML (Zero API Cost, Low Compute)
We offload standard NLP tasks (Entities and Sentiment) to specialized, small machine learning models running locally, rather than sending them to an LLM.

**Option 2A: The Node.js "All JS" Route (Easiest to Deploy)**
- **Entities:** Use `compromise` (a lightning-fast JS NLP library) to extract `Person`, `Organization`, and `Place`.
- **Sentiment:** Use `Xenova/transformers.js`. This allows us to run a tiny, pre-trained HuggingFace model (like `distilbert-base-uncased-finetuned-sst-2-english`) *directly inside the Node.js process*.
- *Pros:* Keeps the stack unified (100% JS). Easy deployment.
- *Cons:* Node.js isn't perfectly optimized for heavy ML; `transformers.js` is great but has limits compared to Python.

**Option 2B: The Python Microservice (Most Robust & Industry Standard)**
- Create a lightweight Python `FastAPI` service (`enrichment-service`).
- The Node.js ingestion worker sends an HTTP request with article text to the Python service.
- Python uses **spaCy** (the industry standard for lightning-fast, highly accurate entity extraction).
- Python uses **VADER** (specifically tuned for news/social media) or a small transformer for sentiment.
- *Pros:* Bulletproof. Scales beautifully. spaCy is far more accurate than JS alternatives.
- *Cons:* You now have two services to deploy (Node.js and Python).

#### Stage 3: High-Order LLM Reasoning (The "Brain")
With basic metadata, entities, category, and sentiment already calculated for free, what do we actually use the LLM for?
- **Story Clustering:** We use the LLM to group articles together (e.g., "These 5 articles from different regions are talking about the same trade deal").
- **Perspective Gap Detection:** We feed the LLM a cluster of articles and ask: "How does the Chinese media framing of this event differ from the US media framing?"
- *Outcome:* We send fewer, but larger, highly valuable batches to the LLM. We only spend our rate-limit budget on deep analysis that heuristics and small ML models cannot do.

---

## 3. Ideation & Decision Matrix

| Enrichment Task | Current Method | Proposed Alternative | Complexity to Implement |
| :--- | :--- | :--- | :--- |
| **Categories** | Groq / Prompt | Stage 1 Keyword Heuristics + fallback to `natural` (JS lib) | Low |
| **Event Region** | Groq / Prompt | Stage 1 Gazetteer (List of countries/cities to regions) | Low |
| **Named Entities** | Groq / Prompt | Stage 2 Python `spaCy` OR Node `compromise` | Medium |
| **Sentiment** | Groq / Prompt | Stage 2 Python `VADER` OR Node `transformers.js` | Medium |
| **Perspective/Bias**| Groq / Prompt | Inherited from `feeds.js` + LLM Cluster Analysis | Low |
| **Clustering** | Groq / Prompt | Keep on Groq (LLMs are best at this) | N/A |

---

## 4. Discussion Notes / Action Items

*(Mainu and AI: Drop notes, thoughts, and decisions here)*

**Mainu's Focus:** "Explore openly and prioritize sound architectural decisions over just making it work. If making the architecture robust takes a bit of effort I'm willing to go that way still."

**AI's Recommendation:**
If you are willing to put in the effort for a robust architecture, I highly recommend building **Option 2B (The Python Microservice)**. 

*Why?* 
- Python is the undisputed king of ML and NLP. 
- Setting up a small `FastAPI` + `spaCy` service is incredibly standard for news aggregators.
- It cleanly separates your "Data Moving" logic (Node.js fetching RSS and talking to Postgres) from your "Data Crunching" logic (Python extracting NLP data).
- When you eventually want to do more advanced things (like generating embeddings for similarity search, or full-text search), having a Python service ready to go makes it trivially easy.

### What do you think? 
1. Are you open to running a separate Python Microservice for ML tasks?
2. Or would you strongly prefer to keep everything in the Javascript/Node ecosystem using `transformers.js`?
