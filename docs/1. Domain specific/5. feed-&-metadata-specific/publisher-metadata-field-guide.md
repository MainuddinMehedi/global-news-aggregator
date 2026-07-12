# Publisher Metadata Field Guide

> **Purpose:** Study material. Read this before starting any source research.  
> **Version:** 1.0  
> **Last Updated:** 2026-07-13

This document explains every metadata field in the publisher profile template — what it means, why the system needs it, and where it shows up.

---

## How to Read This Guide

Every field is annotated with **where it surfaces** in the system:

| Tag             | Meaning                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| 🖥️ **UI**       | Visible to users — appears on article cards, filters, or the Publisher Profile page     |
| 🤖 **AI**       | Fed into AI enrichment prompts, clustering weights, or relevance scoring                |
| ⚙️ **Internal** | Used by the ingestion pipeline, data layer, or admin tooling — never shown to end users |

Fields can have multiple tags. For example, `publisherType` is both 🖥️ UI (shown in filters) and 🤖 AI (used as context in enrichment prompts).

---

## The Three Classes of Metadata

Every field in a publisher profile belongs to exactly one of three classes. This distinction is fundamental — it determines how you research, store, and present the field.

### Class A — Facts

**What they are:** Fields with a single correct answer.  
**How you verify:** Official website, company records, encyclopedias.  
**How you store:** Flat values. No attribution needed — anyone can verify.  
**Examples:** Publisher name, country, owner, website, founded year.

### Class B — Classifications

**What they are:** Objective categories drawn from a controlled vocabulary you define.  
**How you verify:** Public descriptions + observable content patterns.  
**How you store:** Flat values from a fixed set of allowed options.  
**Examples:** "Newspaper", "Wire Service", "National", "International".

> The key distinction from Facts: a Fact has one universal answer. A Classification depends on the taxonomy you create. "Commercial Publisher" is your category — another system might call the same outlet a "Private Media Company." Both are correct.

### Class C — Assessments

**What they are:** Subjective evaluations that reasonable people might disagree on.  
**How you verify:** Article sampling, editorial analysis, external evaluators.  
**How you store:** Value + evidence + source + confidence. **Always attributed.**  
**Examples:** Political leaning, editorial orientation, reliability.

> **Critical Rule:** Your system never says "Reuters is centrist." It says "Based on [evidence], we assess Reuters as centrist with confidence 0.85." That's the difference between an opinion and an intelligence assessment.

---

## Section 1: Identity (Facts)

These fields establish who the publisher is. They're entered once and rarely change.

### `name`

- **Class:** Fact
- **Definition:** The publisher's official English name as they present themselves.
- **Why it matters:** This is how the publisher appears everywhere in the system — article cards, filters, search results, publisher profiles.
- **Surfaces:** 🖥️ UI — displayed on every article card, filter sidebar, publisher profile header.
- **Research:** Official website, typically the masthead or About page.

### `slug`

- **Definition:** A URL-friendly identifier derived from the name (e.g., `nikkei-asia`).
- **Why it matters:** Used for URL routing. If you build a `/publishers/nikkei-asia` page, this is the path segment.
- **Surfaces:** ⚙️ Internal — URL construction only.
- **Research:** Generate from name. Lowercase, hyphens, no special characters.

### `website`

- **Definition:** The publisher's primary website URL.
- **Why it matters:** Provides a direct link from the publisher profile page to their site.
- **Surfaces:** 🖥️ UI — clickable link on the Publisher Profile page.
- **Research:** Self-evident. Use the canonical domain (e.g., `https://asia.nikkei.com`, not a subdomain or alternative domain).

### `publisherCountry`

- **Definition:** The country where the publisher is headquartered.
- **Why it matters:** This is one of the three axes in your filtering system. The `sourceRegion` is derived from this via `regionMapping.js`. When a user filters by "Asia-Pacific" in Source Origin, they're filtering by this field.
- **Surfaces:** 🖥️ UI — Source Origin filter axis, publisher profile, article cards (as a flag or badge). 🤖 AI — gives the enrichment model context about the source's geopolitical base.
- **Research:** Official About page, contact page, or corporate filings.

### `language`

- **Definition:** The language of the RSS feed content.
- **Why it matters:** Ensures the ingestion pipeline only processes feeds it can handle. All current feeds are English.
- **Surfaces:** ⚙️ Internal — ingestion validation only.
- **Research:** Observable from the feed itself.

### `foundedYear`

- **Definition:** The year the publisher (or its parent organization) was established.
- **Why it matters:** A credibility and context signal. A publisher founded in 1851 (Reuters) carries different institutional weight than one founded in 2015. Shown on the publisher profile to give users a sense of the outlet's history.
- **Surfaces:** 🖥️ UI — Publisher Profile page (subtle, in the header or sidebar).
- **Research:** Official website, Encyclopaedia Britannica, Wikipedia (cross-referenced).

### `description`

- **Definition:** A 2–3 sentence summary of who this publisher is, what they cover, and what makes them distinctive.
- **Why it matters:** This is the "About" blurb on the Publisher Profile page. It helps users quickly understand a source they're unfamiliar with.
- **Surfaces:** 🖥️ UI — Publisher Profile page, possibly as a tooltip on article cards.
- **Research:** Write this yourself after completing all other research. It should synthesize your findings into clear prose.

---

## Section 2: Ownership (Facts)

Ownership metadata answers the question: _who controls this publisher and how?_

### `owner`

- **Definition:** The entity that owns or controls the publisher.
- **Why it matters:** Ownership directly affects editorial independence. Users of an intelligence system need to know if a source is owned by a government, a political party, a tech conglomerate, or an independent media company.
- **Surfaces:** 🖥️ UI — Publisher Profile page (Ownership section).
- **Research:** Official About page, annual reports, company registries.

### `parentOrganization`

- **Definition:** The ultimate parent entity, if different from the direct owner.
- **Why it matters:** Traces the ownership chain. For example, SCMP is owned by Alibaba Group — but Alibaba's relationship to the Chinese state adds a layer of context. This field captures that chain.
- **Surfaces:** 🖥️ UI — Publisher Profile page. ⚙️ Internal — helps identify publisher relationships.
- **Research:** Corporate filings, Wikipedia (as discovery), cross-referenced with official disclosures.

### `stateFunded`

- **Definition:** Boolean — does the publisher receive direct government funding?
- **Why it matters:** This is a critical transparency signal. State-funded ≠ unreliable, but users deserve to know. BBC, ABC Australia, and NHK are state-funded but editorially independent. CGTN is state-funded and editorially directed. The distinction matters, but the fact must be disclosed first.
- **Surfaces:** 🖥️ UI — transparency badge on Publisher Profile and potentially on article cards. 🤖 AI — included in enrichment context.
- **Research:** Government budget documents, official disclosures, press freedom reports.

### `ownershipNotes`

- **Definition:** Free-text notes about ownership nuances that structured fields can't capture.
- **Why it matters:** This is where you record things like "Although commercially owned, Nikkei has unusually close relationships with Japanese industry" or "CNA is state-owned but operates with a degree of editorial autonomy within Singapore's media landscape." These notes prevent oversimplification.
- **Surfaces:** ⚙️ Internal — informs your own understanding. Could optionally surface on Publisher Profile as a disclosure note.
- **Research:** Write after completing ownership research. Capture anything the structured fields don't convey.

---

## Section 3: Classifications

These fields categorize the publisher using your **internal taxonomy** — a controlled vocabulary you define and own. They're objective in the sense that you're observing how the publisher operates, but the categories themselves are your design decisions.

### `ownershipType`

- **Definition:** The structural category of ownership.
- **Allowed values:** `Commercial` · `State` · `Public Service` · `Cooperative` · `Non-profit` · `Academic`
- **Why it matters:** Powers the Source Type filter axis and appears on publisher profiles. Also determines how the AI contextualizes the source.
- **Surfaces:** 🖥️ UI — filter, publisher profile badge. 🤖 AI — enrichment context.
- **How to distinguish:**

| Value          | Meaning                                                     | Example                            |
| -------------- | ----------------------------------------------------------- | ---------------------------------- |
| Commercial     | Privately or publicly owned for profit                      | Nikkei, Bloomberg, SCMP            |
| State          | Owned and editorially directed by a government              | CGTN, Bernama, Antara              |
| Public Service | Government-funded but with statutory editorial independence | BBC, ABC Australia, NHK            |
| Cooperative    | Owned by member organizations (typically newspapers)        | Kyodo News, AP, PTI                |
| Non-profit     | Funded by donations, grants, or endowments                  | ProPublica, The Conversation       |
| Academic       | Operated by a university or research institution            | The Conversation (also non-profit) |

### `publisherType`

- **Definition:** The kind of media outlet.
- **Allowed values:** `Newspaper` · `Wire Service` · `Broadcaster` · `Magazine` · `Digital Native` · `Government Agency`
- **Why it matters:** Wire services produce raw dispatches. Newspapers produce analysis. Broadcasters produce video-first content with text summaries. This affects how the AI reads the article and how clustering weights the source.
- **Surfaces:** 🖥️ UI — publisher profile badge. 🤖 AI — enrichment context (a wire service article is typically more factual and less opinionated).
- **How to distinguish:**

| Value             | Meaning                                                     | Example                             |
| ----------------- | ----------------------------------------------------------- | ----------------------------------- |
| Newspaper         | Traditional print or digital newspaper with editorial staff | Nikkei Asia, The Hindu, Japan Times |
| Wire Service      | Produces raw dispatches syndicated to other publishers      | Reuters, Kyodo, PTI, AP             |
| Broadcaster       | TV/Radio outlet with a digital presence                     | CNA, ABC Australia, BBC             |
| Magazine          | Periodical with longer-form content                         | The Economist, Foreign Policy       |
| Digital Native    | Born online, no print heritage                              | TechCrunch, Rest of World           |
| Government Agency | Official government communication channel                   | Xinhua, TASS                        |

### `editorialStyle`

- **Definition:** The dominant mode of journalism the publisher practices.
- **Allowed values:** `Straight News` · `Analysis` · `Opinion-heavy` · `Investigative` · `Mixed`
- **Why it matters:** Determines how the AI interprets tone and framing. An "Analysis" outlet is expected to have perspective — that's not bias, it's the format. An "Opinion-heavy" outlet needs more scrutiny for factual claims.
- **Surfaces:** 🤖 AI — influences sentiment and bias analysis. 🖥️ UI — Publisher Profile page.

### `coverageScope`

- **Definition:** The geographic breadth of the publisher's reporting.
- **Allowed values:** `Local` · `Regional` · `National` · `International` · `Global`
- **Why it matters:** Already used in your 3-axis filter system. A "National" publisher primarily covers its own country. A "Global" publisher covers world events broadly.
- **Surfaces:** 🖥️ UI — filter axis, publisher profile. 🤖 AI — helps interpret whether an article is domestic vs. foreign reporting.

### `originality`

- **Definition:** How much of the publisher's content is original vs. syndicated from wire services.
- **Allowed values:** `Primary Reporter` · `Mixed` · `Mostly Syndicated`
- **Why it matters:** This is critical for story clustering. If your system detects the same story from 5 sources, it needs to know which one likely broke the story. A "Primary Reporter" is more likely to be the original source. A "Mostly Syndicated" outlet is likely republishing a Reuters or AP wire.
- **Surfaces:** 🤖 AI — clustering weight for representative article selection. ⚙️ Internal — deduplication intelligence.

### `sourceRegion`

- **Definition:** The macro geopolitical region the publisher belongs to, derived from `publisherCountry`.
- **Allowed values:** `Asia-Pacific` · `Europe` · `Middle East` · `North America` · `Africa` · `Latin America` · `Global`
- **Why it matters:** Powers the Source Origin axis in your 3-axis filter system. When a user selects "Asia-Pacific" in Source Origin, they see articles from publishers based in that region.
- **Surfaces:** 🖥️ UI — Source Origin filter axis.
- **Research:** Derived from `publisherCountry` using `regionMapping.js`. You don't research this — it's computed.

### `subRegion`

- **Definition:** A more granular regional classification within the macro region.
- **Allowed values (for Asia-Pacific):** `East Asia` · `Southeast Asia` · `South Asia` · `Oceania` · `Central Asia`
- **Why it matters:** Enables finer-grained filtering and helps the UI organize publishers by sub-region on the Publisher Catalog page.
- **Surfaces:** 🖥️ UI — Publisher Profile page, sub-region grouping.
- **Research:** Straightforward geographic classification.

---

## Section 4: Coverage

Coverage metadata describes **what** the publisher covers, as distinct from **where** the publisher is based. This distinction is the foundation of your 3-axis filter design — a Japanese publisher covering Middle Eastern conflict produces an article that maps to "Asia-Pacific" on the Source Origin axis but "Middle East" on the Event Region axis.

### `primaryRegions`

- **Definition:** The countries or regions the publisher covers most frequently and with the most depth.
- **Why it matters:** Helps the AI understand whether an article is inside or outside the publisher's core expertise. A Nikkei article about Japanese trade policy is in their wheelhouse. A Nikkei article about Nigerian elections is outside it.
- **Surfaces:** 🖥️ UI — Publisher Profile page (coverage map or chips). 🤖 AI — expertise context.
- **Research:** Sample 20–30 articles and note the geographic distribution.

### `secondaryRegions`

- **Definition:** Regions the publisher covers regularly but with less depth or frequency.
- **Surfaces:** 🖥️ UI — Publisher Profile page. 🤖 AI — expertise context.
- **Research:** Same article sampling as `primaryRegions`.

### `categoryStrengths`

- **Definition:** The topical categories where the publisher excels — organized as `strong`, `moderate`, and `weak`.
- **Why it matters:** Imagine your AI receives a semiconductor trade article from Nikkei. If the system knows Nikkei is _strong_ in Technology and Supply Chains, the AI can weight this source more heavily in clustering and treat its analysis with higher confidence for that topic.
- **Surfaces:** 🖥️ UI — Publisher Profile page (visual strength indicator, like a bar chart or tag cloud). 🤖 AI — topic expertise weighting in clustering and enrichment.
- **Research:** Sample articles and categorize them. What topics appear most? What's conspicuously absent?

---

## Section 5: Assessments (Attributed)

These are the fields where intellectual honesty matters most. Every assessment is subjective — reasonable people can disagree. Your system stores them with **evidence**, making the reasoning transparent.

Each assessment field stores:

```json
{
  "value": "The assessment itself",
  "evidence": "What you observed or cited that supports this assessment",
  "source": "Where the evidence came from",
  "confidence": 0.72
}
```

### `editorialOrientation`

- **Definition:** The publisher's relationship to external power structures.
- **Allowed values:** `Independent` · `State-Aligned` · `Party-Aligned` · `Corporate-Aligned`
- **Why it matters:** This is the most important assessment field. It tells the user whether the publisher operates with editorial autonomy or is influenced by external interests. It directly informs how users should interpret the publisher's coverage.
- **Surfaces:** 🖥️ UI — Publisher Profile page (prominent badge with evidence attribution). This is a transparency signal.
- **Research:** Editorial policy page + article sampling. Does the publisher ever criticize its owner or the government that funds it?

| Value             | What it means                                            | Example                              |
| ----------------- | -------------------------------------------------------- | ------------------------------------ |
| Independent       | No observable external editorial pressure                | Reuters, Nikkei Asia                 |
| State-Aligned     | Editorial line consistently follows government positions | CGTN, Bernama, Antara                |
| Party-Aligned     | Editorial line follows a specific political party        | Some national newspapers in India    |
| Corporate-Aligned | Editorial line influenced by corporate owner interests   | Rare, but worth noting when observed |

### `politicalLeaning`

- **Definition:** The publisher's general position on the political spectrum.
- **Allowed values:** `Left` · `Centre-Left` · `Centre` · `Centre-Right` · `Right` · `State-Aligned`
- **Why it matters:** Helps users calibrate the framing they're reading. A Centre-Left publisher will frame labor disputes differently than a Centre-Right one. This isn't about labeling sources as "biased" — it's about giving users the context to read critically.
- **Surfaces:** 🖥️ UI — Publisher Profile page (with evidence attribution shown). **Never shown without attribution.**
- **Research:** External evaluators (MBFC, Ad Fontes) if available. Otherwise, self-assessed from article sampling with appropriate low confidence (0.50–0.70).

### `economicPerspective`

- **Definition:** The publisher's general stance on economic issues.
- **Allowed values:** `Pro-market` · `Mixed` · `State-directed` · `Non-economic`
- **Why it matters:** Particularly relevant for business and trade coverage. A pro-market publisher frames tariffs differently than one with a state-directed perspective.
- **Surfaces:** 🤖 AI — enrichment context for economic articles. 🖥️ UI — Publisher Profile page (secondary detail).

### `internationalAlignment`

- **Definition:** The countries or blocs the publisher's coverage tends to favor or align with.
- **Why it matters:** A Japanese publisher might consistently frame US-Japan alliance positively. A Chinese state media outlet will align with Chinese foreign policy positions. This isn't bias in the pejorative sense — it's perspective, and users deserve to know it.
- **Surfaces:** 🖥️ UI — Publisher Profile page. 🤖 AI — critical context for geopolitical enrichment.
- **Research:** Read 10+ articles on international disputes. Note which side the framing favors.

### `reliability`

- **Definition:** Your overall assessment of the publisher's factual reliability.
- **Allowed values:** `High` · `Medium` · `Low`
- **Why it matters:** Influences how much weight the system gives to this source in clustering and ranking.
- **Surfaces:** 🖥️ UI — Publisher Profile page (prominent). 🤖 AI — ranking weight.
- **Research:** Check for corrections policy, fact-checking standards. External evaluators if available. Note: almost all major publishers in your catalog will be "High" — you're curating reputable sources, not indexing the entire internet.

### `externalRatings`

- **Definition:** Ratings from third-party media evaluators, when available.
- **Why it matters:** Adds third-party validation (or contradiction) to your own assessments. These are optional enrichments — many APAC publishers won't be rated.
- **Surfaces:** 🖥️ UI — Publisher Profile page (shown as external citations when available).
- **Research:** Check MBFC, Ad Fontes, NewsGuard. Record `null` for unavailable ratings — don't force it.

---

## Section 6: Intelligence (AI-Only)

These fields exist purely to make the AI smarter. They don't appear in the UI. They're injected into enrichment prompts and clustering algorithms.

### `knownPerspective`

- **Definition:** A free-text description of how this publisher typically frames events.
- **Why it matters:** When the AI enriches an article, it can use this context to distinguish between editorial framing and factual bias. "This article comes from a Japanese business newspaper that typically frames events through trade and market impact" helps the model produce better sentiment and bias analysis.
- **Surfaces:** 🤖 AI — injected into Stage 2 enrichment prompts.
- **Research:** Write after completing all other research. One paragraph that captures the publisher's characteristic voice.

### `knownStrengths`

- **Definition:** Topics and regions where the publisher has recognized expertise.
- **Why it matters:** Used to weight publisher authority in story clustering. When selecting the "representative article" for a story cluster about Asian semiconductor trade, an article from Nikkei (known strength: Supply Chains, Technology) should outrank one from a generalist outlet.
- **Surfaces:** 🤖 AI — clustering weight. Also shown 🖥️ UI — Publisher Profile page.

### `knownWeaknesses`

- **Definition:** Topics or regions where the publisher has limited or no meaningful coverage.
- **Why it matters:** Helps the AI flag when an article falls outside the publisher's expertise. A Nikkei article about Nigerian elections should be treated differently than a Nikkei article about Toyota.
- **Surfaces:** 🤖 AI — confidence calibration. Not shown in UI (avoids appearing judgmental toward publishers).

---

## Section 7: Selection & Research

### `selectionRationale`

- **Definition:** A clear statement explaining why this publisher was added to the system and what gap it fills.
- **Why it matters:** This is the single most important field for long-term catalog maintenance. Six months from now, when you have 50 sources and wonder if you really need three Japanese outlets, this field is what prevents arbitrary pruning. It also forces you to think critically about diversity before adding a source.
- **Surfaces:** ⚙️ Internal — catalog maintenance. Could optionally surface on Publisher Profile.
- **Research:** Write this _before_ you commit to adding a source. If you can't articulate why this publisher belongs, it probably doesn't.
- **Example:** _"Nikkei Asia was selected because it provides original English-language reporting on Asian business, technology, trade, and supply chains with depth that wire services don't match. It complements Reuters (wire, breadth) with focused regional expertise."_

### `researchNotes`

- **Definition:** Free-text notes capturing nuances, surprises, or context discovered during research.
- **Why it matters:** Structured fields can't capture everything. This is where you record things like "Although classified as Independent, the publisher's coverage of [specific topic] shows a consistent pattern of [observation]." These notes are invaluable when revisiting a profile months later.
- **Surfaces:** ⚙️ Internal — research audit trail.

### `research.status`

- **Definition:** The current state of the publisher's research profile.
- **Allowed values:** `DRAFT` · `ESTABLISHED` · `NEEDS_REVIEW` · `DEPRECATED`
- **Why it matters:** Tracks which publishers have completed the full research pipeline and which are still being vetted.
- **Surfaces:** ⚙️ Internal — quality control.

### `research.peerReviewDate`

- **Definition:** The date you last reviewed this profile with fresh eyes (at least 1 week after initial research).
- **Why it matters:** Catches confirmation bias. Your first impression of a publisher after reading 30 articles might shift when you revisit the data later.
- **Surfaces:** ⚙️ Internal.

---

## Section 8: Feed Configuration

> **Key Architectural Point:** A publisher can have **multiple feeds**. Reuters might have a World News feed, a Business feed, and a Technology feed. The metadata belongs to the **publisher**, not the feed. Feeds are lightweight ingestion endpoints.

### `feeds[]`

- **Definition:** An array of RSS/Atom feed endpoints belonging to this publisher.
- **Fields per feed:**

| Field      | Type    | Purpose                                                        |
| ---------- | ------- | -------------------------------------------------------------- |
| `url`      | String  | The RSS/Atom feed URL                                          |
| `category` | String  | What section this feed covers (e.g., "World News", "Business") |
| `feedType` | String  | "RSS 2.0" or "Atom"                                            |
| `enabled`  | Boolean | Whether the pipeline should fetch this feed                    |

- **Why it matters:** Separating feeds from publisher metadata means you can add a second Nikkei feed (e.g., Technology) without duplicating the entire publisher profile. It also lets you enable/disable individual feeds without affecting the publisher's status.
- **Surfaces:** ⚙️ Internal — ingestion pipeline. 🖥️ UI — Publisher Profile page (feed list with status indicators).

---

## Section 9: System Mapping

These fields bridge your research to the current `FeedSource` schema. They exist because the pipeline needs specific field values today, and the full schema migration (Publisher/Feed split) hasn't happened yet.

### `sourceType`

- **Maps from:** `ownershipType` + `publisherType`
- **Current allowed values:** "Commercial Publisher", "State Media", "Independent Wire", etc.
- **Surfaces:** 🖥️ UI — Source Type filter axis.

### `biasGroup`

- **Maps from:** `editorialOrientation` + `politicalLeaning`
- **Current allowed values:** "Centrist", "State-Aligned", etc.
- **Surfaces:** 🖥️ UI — displayed in certain contexts.

### `coverageScope`

- **Maps from:** `classifications.coverageScope`
- **Current allowed values:** "National", "Global", etc.
- **Surfaces:** 🖥️ UI — filter.

---

## Appendix A: Publisher Profile Page Concept

When a user clicks on a publisher name (on an article card, in a filter, or on a dedicated Sources page), they see a Publisher Profile with:

### Header

- Publisher name, country flag, founded year
- Badges: Publisher Type, Ownership Type, Coverage Scope
- Website link

### About

- Description (2–3 sentences)
- Selection Rationale (optional)

### Ownership & Transparency

- Owner, Parent Organization
- State Funded indicator (prominent if true)
- Ownership Notes (if notable)

### Editorial Profile

- Editorial Orientation (with evidence attribution)
- Political Leaning (with evidence attribution)
- International Alignment tags
- **"Based on [source]. Confidence: [score]"** shown alongside each assessment

### Coverage

- Primary/Secondary regions (map or tag chips)
- Category Strengths (visual bar chart or tiered tags: Strong / Moderate / Weak)

### Feeds

- List of RSS feeds with active/disabled status

### Provenance Footer

- "Profile researched on [date] by [researcher]. Last peer-reviewed on [date]."

### What is NOT shown in the UI

- `knownPerspective` (AI-only)
- `knownWeaknesses` (AI-only, avoids appearing judgmental)
- `economicPerspective` (secondary, AI-primary)
- `originality` (AI/internal only)
- `systemMapping` (pipeline mapping)
- `researchNotes` (internal audit trail)

---

## Appendix B: How Publisher Metadata Flows Through the System

```
┌─────────────────────────────────────┐
│         PUBLISHER PROFILE           │
│     (researched once, updated       │
│       rarely — the foundation)      │
└──────────┬──────────────────────────┘
           │
           │ feeds[] endpoints
           ▼
┌─────────────────────────────────────┐
│        INGESTION PIPELINE           │
│                                     │
│  RSS Fetch → Dedup → RawArticle     │
│                                     │
│  Article inherits from publisher:   │
│  • sourceCountry                    │
│  • sourceType                       │
│  • biasGroup                        │
│  • coverageScope                    │
└──────────┬──────────────────────────┘
           │
           │ + publisher intelligence
           ▼
┌─────────────────────────────────────┐
│        AI ENRICHMENT (Stage 2)      │
│                                     │
│  LLM receives:                      │
│  • Article text                     │
│  • knownPerspective                 │
│  • categoryStrengths                │
│  • editorialOrientation             │
│  • originality                      │
│                                     │
│  Produces: entities, sentiment,     │
│  biasNote, eventRegion              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│        STORY CLUSTERING             │
│                                     │
│  Uses publisher metadata for:       │
│  • originality → break-source       │
│    weighting                        │
│  • knownStrengths → topic           │
│    authority                        │
│  • publisherType → wire vs.         │
│    analysis distinction             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│        FRONTEND                     │
│                                     │
│  3-Axis Filters:                    │
│  • Source Origin (sourceRegion)      │
│  • Source Type (sourceType)          │
│  • Event Region (from article)      │
│                                     │
│  Publisher Profile Page:             │
│  • All UI-tagged fields             │
│  • Assessment evidence shown        │
│  • Feed status                      │
└─────────────────────────────────────┘
```
