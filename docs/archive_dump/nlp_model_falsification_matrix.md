# NLP Entity Recognition: Falsification Matrix

**Problem Statement:** The current `en_core_web_md` spaCy model fails to recognize newer geopolitical or tech entities (e.g., "Anthropic") due to knowledge cut-off in its static word vectors. The user proposed fine-tuning the `md` model using failure cases to solve this. We must evaluate this against our strict production constraints (Free-tier RAM limits, maintenance overhead).

---

## 1. Fine-Tuning the Existing `en_core_web_md` Model
**The Approach:** Collect failed articles, manually annotate them with correct entities, and run spaCy's `train` pipeline to update the model weights.

* **Efficacy & Determinism (FALSIFIED):** spaCy's standard NER models suffer heavily from **Catastrophic Forgetting**. If we train it on a few hundred examples of "Anthropic = ORG", the model mathematically shifts its weights and will rapidly "forget" how to recognize other entities it used to know, unless we interleave our new data with the original gigabytes of training data (which we do not own).
* **Operational Overhead & Cost (FALSIFIED):** The human overhead is immense. We would have to manually label hundreds of JSONL sentences using an annotation tool (like Prodigy or Doccano) just to teach it a few new companies.
* **Maintenance & Complexity (Debt):** We now own a custom `.whl` model file. Next month, when a new geopolitical player emerges, we have to repeat the entire manual labeling and training loop. This places us on an infinite maintenance treadmill.
* **Scope Realism:** Highly unrealistic for a lightweight aggregator. The data-engineering tax outweighs the benefits.

---

## 2. Upgrading to a Heavy Local Model (`en_core_web_trf` or GLiNER)
**The Approach:** Swap the static `md` model for a modern Transformer-based model (RoBERTa) or a Zero-Shot NER model (GLiNER) that can contextualize unseen words instantly.

* **Efficacy:** Extremely high. They instantly recognize new entities without any training.
* **Operational Overhead & Cost (FALSIFIED):** These models require PyTorch and load 500MB to 1.5GB of weights directly into RAM. Our strict operational constraint is deploying to **Free Tiers** (e.g., Render, Railway, Heroku), which strictly cap RAM at **512MB**. The container will instantly crash with an OOM (Out of Memory) error.
* **Scope Realism:** Unviable under our current zero-cost hosting infrastructure constraints.

---

### Option 3: External Free-Tier NER Hosting (Hugging Face, Cloudflare, Colab)
* **What it is:** Moving the strict NLP model (BERT/spaCy) off our Render server and onto a free cloud provider like Hugging Face Inference API, Cloudflare Workers AI, or Kaggle.
* **Falsification (Why it fails):**
    * **Efficacy (The Fatal Flaw):** It does not solve our core problem. A BERT NER model hosted on Hugging Face will still extract the exact literal string `"CU admin"`. It lacks the reasoning capability to map `"CU admin"` to the country `"Bangladesh"`. It will still fail 57% of our gazetteer mappings just like local spaCy did.
    * **Operational Overhead:** Hugging Face CPU Spaces fall asleep. Colab is ephemeral and disconnects. The Inference API has aggressive rate limits (100k requests/month) and cold-start latency when models are swapped out of memory. 
    * **Conclusion:** **REJECTED.** The bottleneck isn't *where* the NER model is hosted; the bottleneck is that mathematical Named Entity Recognition cannot perform contextual geopolitical mapping.

### Option 4: LLM API (Gemini Flash / Groq)
* **What it is:** Ripping out strict NER entirely and sending the article text to a fast, generative LLM (like Gemini 1.5 Flash or Groq Llama-3) with a structured JSON prompt: *"Read this article and return the exact geopolitical region it affects."*

* **Efficacy & Determinism:** Near 100%. Modern LLMs have real-time knowledge of companies like Anthropic and perform highly accurate Named Entity Recognition out of the box. Using strict JSON mode enforces deterministic outputs.
* **Operational Overhead & Cost:** **Zero local RAM usage.** The microservice remains tiny. Gemini 1.5 Flash offers a very generous free tier (15 requests per minute, 1 million tokens). Groq is completely free and practically instant.
* **Maintenance & Complexity:** Zero maintenance. We don't maintain weights, we don't label data. If a new company emerges tomorrow, the LLM already knows it or infers it perfectly from context.
* **Scope Realism:** **VALIDATED.** This perfectly fits a low-maintenance, zero-cost, high-accuracy architectural profile.

---

## Conclusion & Architectural Decision
Training the local `md` model introduces fatal Catastrophic Forgetting and massive manual labeling overhead. Heavy local models (GLiNER) violate our 512MB RAM free-tier constraints. 

**Recommendation:** We should abandon local spaCy for Stage 2 NER and migrate the extraction logic to a **Free-Tier LLM API (e.g., Gemini Flash)**. It removes all local RAM bottlenecks, eliminates the need for manual model training, and instantly solves the knowledge cut-off problem.
