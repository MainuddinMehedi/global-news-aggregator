# Architectural Philosophy: The "User-Agnostic" News Engine

## 1. Core Identity & Platform Goal

This project is a **User-Agnostic Global News Aggregator**. It is *not* exclusively a niche geopolitical tracker, nor is it a dedicated competitive exam (BCS/Bank) preparation app.

Instead, it is a high-signal, low-noise reading platform designed to be universally useful. By rigorously filtering the internet into 10 pristine categories, the platform allows different demographics to extract distinct value:

* A **Day Trader** can filter for the `Economy` and `Business` buckets.
* A **Geopolitical Analyst** can filter for `Geopolitics` and `Security`.
* A **Competitive Exam Candidate (Bangladesh)** can use it as a powerful "Current Affairs" tool by tracking the `Bangladesh`, `Geopolitics`, and `Sports` buckets.

The philosophy is **"Views, Not Silos"**: The backend ingests data broadly but cleanly. The frontend allows users to shape that pristine data into the exact "View" they need.

## 2. The "Master Control" Synergy (Stage 1 + Stage 2)

To maintain this user-agnostic flexibility without suffering from "content aggregator bloat" (like Yahoo News), the pipeline relies on a strict two-stage separation of concerns:

* **Stage 1 (The Bouncer - `gazetteer.json`):** A Node.js Regex compiler that acts as the master control valve. It uses **Weights** to identify high-value news and **Exclusions** to ruthlessly block low-value noise (celebrity gossip, lifestyle fads, daily match recaps).
* **Stage 2 (The Fine-Tooth Comb - Python NER):** A Python AI microservice that reads the filtered articles to extract precise Entities (People, Organizations, Locations, Products).

## 3. Rationale for Specific Domain Decisions

To prevent category bloat while serving diverse users, we handle specific content domains using the following strategies:

### A. Why We Kept "Sports" as a Distinct Category (With a Catch)

* **The Problem:** Broad aggregators drown in daily sports trivia, but dropping sports entirely alienates a massive demographic, including competitive exam candidates who strictly need to track global tournaments for General Knowledge (GK) MCQs.
* **The Solution:** We keep `sports` as Category #10, but we weaponize the `exclusions` array.
* **Implementation:** We assign Weight 3 to major global events (`"olympics"`, `"world cup"`, `"icc"`) and use exclusions (`"match highlights"`, `"transfer rumors"`, `"fantasy football"`) to kill the daily noise. This keeps the category highly relevant for geopolitical soft-power and exam-prep, without diluting the platform's professional tone.

### B. Why "Awards & Honors" is NOT a Category (Search-First Strategy)

* **The Problem:** Users (especially students) need to track the Nobel Prize, Oscars, and Ekushey Padak. Creating a dedicated category for this causes structural bloat.
* **The Solution:** Rely on the synergy between Stage 1 and Stage 2.
* **Implementation:** If the "Nobel Prize in Economics" is awarded, Stage 1 catches the word `"economy"` and routes it to the `Economy` bucket. Stage 2 (Python) extracts `"Nobel Prize"` as an Entity. The article stays neatly in the Economy feed, but the user can instantly find it using the search bar. We achieve feature-parity through intelligent indexing, not extra categories.

### C. Folding Edge Cases into the Core 10 Categories

Instead of creating categories for Health, Science, or Crime, we map them based on their *impact*:

* **Applied Science/Medicine** (e.g., vaccine breakthroughs, space exploration) routes to **`Technology`**.
* **High-Profile Justice** routes based on the actor: State law to **`Politics`**, Corporate lawsuits to **`Business`**, International war crimes to **`Geopolitics`**.
* **Disasters** route based on cause: Natural to **`Environment`**, Man-made/Pandemics to **`Security`** or **`Society`**.

## 4. Directive for the AI Agent

When navigating this codebase, writing implementation plans, or suggesting features, **do not suggest adding new categories**. The 10 core categories (`geopolitics, politics, economy, business, technology, security, environment, society, sports, bangladesh`) are locked.

If a new topic needs to be tracked, **update `gazetteer.json`** to fold it into an existing category using strategic Weights and Exclusions. Always prioritize keeping the database lean and relying on Stage 2 Entity extraction for granular searchability.
