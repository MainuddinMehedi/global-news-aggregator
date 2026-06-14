# Stage 1 Gazetteer Upgrades: Trade-off Matrix

This document evaluates potential architectural upgrades to the `gazetteer.js` dictionary used in Stage 1 routing, assessing them via our Dimensional Falsification Matrix.

## Evaluation of Proposed Options

### 1. Weighted Keyword Scoring (Key-Value Weights)
* **Efficacy & Determinism:** High. Differentiates weak signals ("business") from strong definitive markers ("initial public offering"). Highly deterministic and resolves length bias.
* **Operational Overhead & Cost:** Low. Minimal changes to `stage1.js`. The matchers simply increment a score variable by $X$ instead of $1$.
* **Maintenance & Complexity (Debt):** Medium. The data structure changes from an array to an object map.
* **Scope Realism:** High. A perfect, lightweight fit for the current architecture.

### 2. Negative Matchers / Exclusion Zones
* **Efficacy & Determinism:** High. Explicitly eliminates false positives (e.g., "Apple" + "pie" = not technology). Highly deterministic.
* **Operational Overhead & Cost:** Low. Adds a secondary compiled regex layer for `exclusions`.
* **Maintenance & Complexity (Debt):** Medium. Maintaining two lists per category.
* **Scope Realism:** High. An essential safety rail for a regex-based router.

### 3. Algorithmic Stemming via `natural`
* **Efficacy & Determinism:** **Disproven.** Tokenizing and stemming text can lead to unpredictable "over-stemming" false positives where unrelated words reduce to the same stem.
* **Operational Overhead & Cost:** **Disproven.** Stage 1 is designed to be a lightning-fast, cheap first-pass filter. Iterating over every word in an article to tokenize and stem it introduces unnecessary CPU burn and memory overhead compared to native V8 C++ RegExp execution.
* **Maintenance & Complexity (Debt):** Low. Reduces manual synonym entry.
* **Scope Realism:** Low. The performance tax isn't worth the synonym convenience for this layer.

### 4. Database Externalization (PostgreSQL)
* **Efficacy & Determinism:** Neutral (no algorithmic improvement).
* **Operational Overhead & Cost:** **Disproven.** Requires building a local caching layer on the worker to prevent DB queries per article.
* **Maintenance & Complexity (Debt):** **Disproven.** Heavy engineering debt: involves Prisma schema migrations, building an Admin UI for CRUD operations, and maintaining cache invalidation logic. 
* **Scope Realism:** **Disproven.** Over-engineered for the current phase. Database dynamic injection is only necessary when a non-technical ops team needs to modify the list daily without a developer.

---

## The Recommended Path: Config-Driven Hybrid (Weights + Exclusions)

Rather than choosing just one, the most robust and architecturally sound upgrade combines the strengths of Options 1 & 2 while sidestepping the deployment friction of the current system without needing a full database (Option 4).

### The Architecture:
1. **Combine Weights and Exclusions:** Upgrade the schema to support both `terms: { word: weight }` and `exclusions: [words]`.
2. **Decouple from Code (JSON/YAML Config):** Move `gazetteer.js` into a `gazetteer.json` or `gazetteer.yaml` file located in a configuration folder (or hosted externally like Vercel Edge Config / AWS S3 if zero-deploy updates are needed). The Node.js worker loads and compiles this file on boot.
3. **In-Memory Compilation:** On boot, the worker parses the JSON/YAML and compiles both the inclusion and exclusion lists into `RegExp` objects, storing the weights in a lookup map.

### Why this is the best idea:
- **Maximum Efficacy:** We solve both signal strength (Weights) and false positives (Exclusions) simultaneously.
- **Zero Runtime Tax:** We keep the raw speed of native V8 RegExp without the CPU burn of algorithmic stemming.
- **Improved Maintenance Scope:** Moving the dictionary to JSON/YAML makes it portable. If we eventually want zero-deploy updates, we can just point the worker to fetch the JSON from an S3 bucket or a remote config URL on boot, completely avoiding the need for a PostgreSQL table, migrations, and an Admin UI.

---

## Schema Transition Guide: Legacy JS -> Hybrid JSON

To execute this upgrade, the gazetteer structure will transition from a flat JavaScript array to a structured JSON file.

### Legacy State (`gazetteer.js`)
Previously, keywords were maintained directly inside JavaScript modules:
```javascript
export const CATEGORY_KEYWORDS = {
  technology: ["artificial intelligence", "tech", "software"]
};
```
* **Drawbacks:** Every keyword had equal weight. A document with "tech" scored identically to a document centered around "artificial intelligence". We couldn't block false positives. Adding words required code changes.

### Upgraded State (`gazetteer.json`)
The new configuration is maintained as static JSON, decoupling the data from the executable logic:
```json
{
  "categories": {
    "technology": {
      "terms": {
        "artificial intelligence": 3,
        "software": 1,
        "tech": 1
      },
      "exclusions": ["tech support", "software update"]
    }
  }
}
```

### How to Maintain This Moving Forward ("What happens later?")
If you want to add a new keyword (e.g., adding a newly elected politician to the "bangladesh" region), you simply edit `gazetteer.json`:
1. Add the word to the `terms` object with an appropriate weight (1 for general, 2-3 for highly specific).
2. If you notice the word causing false positives, add the conflicting context to the `exclusions` array for that category.
3. The Node.js worker reads this JSON on boot. No changes to `stage1.js` are required.

Later down the roadmap, if we want a non-developer to edit this without touching the repository, we can simply host `gazetteer.json` on Vercel Edge Config, S3, or Firebase Remote Config, and the worker can fetch it over HTTP on boot. No databases required.
