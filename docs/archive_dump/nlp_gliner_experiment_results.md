# GLiNER Zero-Shot NER Experiment Results

We evaluated the **GLiNER** (Generalist and Lightweight Model for Named Entity Recognition) zero-shot model (`urchade/gliner_small-v2.1`) in the Python `enrichment-service` to determine if it could solve our entity-extraction limitations while adhering to our hosting constraints.

---

## 📊 Experiment Parameters
* **Model Checked:** `urchade/gliner_small-v2.1`
* **Labels Utilized:**
  * *Hard News / Geopolitics:* `["Person", "Organization", "Location", "Geopolitical Entity"]`
  * *Soft News:* `["Person", "Organization", "Product", "Event", "Artwork", "Facility"]`
* **Confidence Threshold:** `0.5`
* **Test Dataset:** 195 unprocessed raw articles

---

## 📈 Key Metrics & Results

### 1. Memory Footprint (FALSIFIED)
* **Peak Uvicorn Worker RAM:** **861.48 MB**
* **Free-Tier Constraint:** **512 MB**
* **Verdict:** ❌ **FAILED.** Loading PyTorch (even with a CPU-only build) and DeBERTa-v3-small weights uses nearly 900MB of RAM. This violates the 512MB hosting limit and will trigger immediate Out Of Memory (OOM) container crashes.

### 2. Entity Extraction Quality (VALIDATED)
* **Entity failures:** **1 article** out of 112 successfully processed (0.9% failure rate).
  * *Comparison:* `en_core_web_lg` failed on 6 articles; `en_core_web_md` failed on multiple.
  * *Summary:* GLiNER successfully extracted modern, context-heavy entities like "SpaceX" and "G7 countries" without model retraining.

### 3. Event Region Mapping (VALIDATED)
* **Event Region failures:** **14 articles** out of 112 (12.5% failure rate).
  * *Note on previous baseline:* The baseline audit reported 112 region failures due to a typo in the audit script (`eventRegions` instead of the schema-compliant `eventRegion`). Once corrected, the mapping logic resolved regions successfully for 87.5% of articles.

---

## 🔍 Audit & Curation Notes

### Sample Good Extractions:
* **Title:** *Nepal to start exporting electricity to Bangladesh with symbolic 40MW from Monday*
  * **Entities:** `Nepal`, `Bangladesh`
  * **Region:** `Asia-Pacific` (Successfully mapped via Gazetteer rules)
* **Title:** *Thousands protest as Trump, other world leaders set to meet for G7 summit*
  * **Entities:** `G7 countries`, `Geneva`, `Trump`, `France`
  * **Region:** `Europe` (Mapped via Geneva/France)
* **Title:** *As AI companies race to go public, who else is along for the ride?*
  * **Entities:** `Startups`, `SpaceX`, `AI companies`
  * **Region:** `North America` (SpaceX mapped to North America)

---

## ⚖️ Falsification Verdict

| Dimension | Assessment | Notes |
|---|---|---|
| **Efficacy & Determinism** | ✅ PASS | Excellent zero-shot extraction capability. Highly accurate entity categorization. |
| **Operational Overhead (RAM)** | ❌ FAIL | At **861.48 MB**, it blows past the **512 MB** container RAM ceiling. |
| **Maintenance & Complexity** | ➖ NEUTRAL | Replaces spaCy imports, but PyTorch and HF model management add cold-start weight. |
| **Scope Realism** | ❌ FAIL | Over-engineered memory footprint for simple metadata enrichment. |

---

## 🚀 Final Recommendation

While **GLiNER** provides excellent zero-shot entity extraction quality, its local memory footprint of **861.48 MB** makes it unviable for free-tier deployments. 

The architecture should move away from local ML models for Stage 2 enrichment and migrate to a **Free-Tier LLM API (e.g., Google AI Studio Gemini 1.5 Flash)**. An API-driven solution requires:
1. **0 MB** of local RAM.
2. Near-instant execution.
3. Native support for complex, context-aware geopolitical categorization.
