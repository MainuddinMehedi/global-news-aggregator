# NLP Baseline Audit: `en_core_web_md` vs `en_core_web_lg`

This document audits the extraction quality of the local spaCy NLP models.

## Baseline: `en_core_web_md`
* **Total Processed:** 195 articles
* **Memory Footprint:** ~386 MB (Max Load)

### Extraction Failures

#### 1. Entity Extraction Failures
The model failed to extract any recognized Named Entities from multiple articles. This happens when the model does not recognize modern company names or specific context-heavy terms.
- `The future of fashion starts on TikTok`: Failed to recognize "TikTok" as an Organization.
- `As Anthropic suspends access to new models, India debates its AI future`: Failed to recognize "Anthropic" as an Organization.

#### 2. Sentiment Analysis Failures (22 Articles)
VADER sentiment failed or returned a null/neutral sentiment on 22 articles. VADER struggles with objective news reporting syntax.
- `Wasfia 1st Bangladeshi to conquer K2`
- `Bangladesh calls for inclusive reforms in ILO`

#### 3. Event Region Mapping Failures (112 Articles)
The pipeline failed to map extracted entities back to a specific Event Region in 112 out of 195 articles. `en_core_web_md` extracts highly localized entities (like `CU admin`, `K2`) that do not match the broad, country-level gazetteer mapping system.

---

## Upgrade Test: `en_core_web_lg`
* **Total Processed:** 195 articles
* **Memory Footprint:** ~771 MB (Max Load)

### Extraction Failures

#### 1. Entity Extraction Failures (6 Articles)
While the `lg` model successfully extracted "India" from the Anthropic article, it still completely failed to extract entities from 6 other articles (e.g., `The algorithm behind your wardrobe`, `Measles outbreak...`). 

#### 2. Sentiment Analysis Failures (22 Articles)
Exactly the same failure rate as the `md` model. VADER's limitations are model-agnostic.

#### 3. Event Region Mapping Failures (112 Articles)
**Exactly the same failure rate (112 out of 195).** The `lg` model is "smarter", but it still extracts highly localized/specific entities that fail to match the broad country names in the Stage 1 Gazetteer.

---

## Final Verdict
Upgrading to the `lg` model **more than doubled the RAM usage (from 386 MB to 771 MB)**, completely breaking the 512 MB constraint of free-tier deployments. 

Despite the massive resource cost, it offered **zero measurable improvement** to the overall pipeline drop-off rate. 57% of articles still fail to map to an Event Region. The underlying issue is not the size of the spaCy model, but the architectural disconnect between strict NLP entity extraction and our broad Gazetteer mapping. 

**Recommendation:** Abandon the local spaCy model entirely. Swap to a cheap/fast LLM API (like Gemini Flash) that can dynamically resolve "Anthropic" or "CU admin" into broad geopolitical themes and regions without hardcoded gazetteer mapping.
