# Source Research Standard Operating Procedure (SOP)

> **Status:** Active  
> **Version:** 2.0  
> **Last Updated:** 2026-07-13

---

## Purpose

Every news publisher added to the Global News Aggregator must pass through a structured research phase before it is considered "established." This SOP defines the repeatable methodology.

The completed publisher profile **is** the vetting artifact. Once a publisher has an `ESTABLISHED` profile, it means a human has researched every field, cited evidence for subjective claims, and explicitly marked uncertainties.

**Pre-requisite:** Read the [Publisher Metadata Field Guide](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/5.%20feed-%26-metadata-specific/publisher-metadata-field-guide.md) before starting any research. It explains every field, why it matters, and where it surfaces.

---

## Internal Taxonomy (Controlled Vocabulary)

These are the only allowed values for classification fields. Using a consistent vocabulary across all publishers is what makes the data queryable and comparable.

### Ownership Type

| Value            | Definition                                                  | Example                 |
| ---------------- | ----------------------------------------------------------- | ----------------------- |
| `Commercial`     | Privately or publicly owned, operated for profit            | Nikkei, Bloomberg, SCMP |
| `State`          | Owned and editorially directed by a government              | CGTN, Bernama, Antara   |
| `Public Service` | Government-funded but with statutory editorial independence | BBC, ABC Australia, NHK |
| `Cooperative`    | Owned by member organizations (typically newspapers)        | Kyodo News, AP, PTI     |
| `Non-profit`     | Funded by donations, grants, or endowments                  | ProPublica              |
| `Academic`       | Operated by a university or research institution            | The Conversation        |

### Publisher Type

| Value               | Definition                                                  | Example                   |
| ------------------- | ----------------------------------------------------------- | ------------------------- |
| `Newspaper`         | Traditional print or digital newspaper with editorial staff | Nikkei Asia, The Hindu    |
| `Wire Service`      | Produces raw dispatches syndicated to other publishers      | Reuters, Kyodo, PTI       |
| `Broadcaster`       | TV/Radio outlet with a digital text presence                | CNA, ABC Australia        |
| `Magazine`          | Periodical with longer-form content                         | The Economist             |
| `Digital Native`    | Born online, no print heritage                              | TechCrunch, Rest of World |
| `Government Agency` | Official government communication channel                   | Xinhua, TASS              |

### Editorial Style

| Value           | Definition                                                             | Example                              |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| `Straight News` | Primarily factual, inverted-pyramid reporting                          | Wire services, most wire-fed content |
| `Analysis`      | Factual reporting with contextual interpretation and expert commentary | Nikkei Asia, The Economist           |
| `Opinion-heavy` | Significant portion of output is editorial/commentary                  | Some national dailies                |
| `Investigative` | Long-form, original investigation as primary mode                      | ProPublica, ICIJ                     |
| `Mixed`         | Combines straight news, analysis, and opinion in roughly equal measure | Most large newspapers                |

### Coverage Scope

| Value           | Definition                                             |
| --------------- | ------------------------------------------------------ |
| `Local`         | Covers a specific city or locality                     |
| `Regional`      | Covers a multi-country region (e.g., "Southeast Asia") |
| `National`      | Primarily covers one country's affairs                 |
| `International` | Covers multiple countries with depth                   |
| `Global`        | Broad world coverage across all regions                |

### Originality

| Value               | Definition                                                     |
| ------------------- | -------------------------------------------------------------- |
| `Primary Reporter`  | Majority of content is original reporting by staff journalists |
| `Mixed`             | Combination of original reporting and wire/syndicated content  |
| `Mostly Syndicated` | Primarily republishes wire service or partner content          |

### Editorial Orientation

| Value               | Definition                                               |
| ------------------- | -------------------------------------------------------- |
| `Independent`       | No observable external editorial pressure                |
| `State-Aligned`     | Editorial line consistently follows government positions |
| `Party-Aligned`     | Editorial line follows a specific political party        |
| `Corporate-Aligned` | Editorial line influenced by corporate owner interests   |

### Political Leaning

| Value           | Definition                                               |
| --------------- | -------------------------------------------------------- |
| `Left`          | Consistently progressive editorial positions             |
| `Centre-Left`   | Lean progressive on social and some economic issues      |
| `Centre`        | No consistent lean; balanced or pragmatic editorial line |
| `Centre-Right`  | Lean conservative on economic and some social issues     |
| `Right`         | Consistently conservative editorial positions            |
| `State-Aligned` | Political position follows the state's official line     |

### Source Region

| Value           | Countries                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| `Asia-Pacific`  | Japan, China, India, Bangladesh, Singapore, Malaysia, Indonesia, Australia, etc. |
| `Europe`        | UK, France, Germany, Russia, etc.                                                |
| `Middle East`   | Qatar, Saudi Arabia, Israel, Egypt, Turkey, etc.                                 |
| `North America` | USA, Canada                                                                      |
| `Africa`        | All African nations                                                              |
| `Latin America` | All Central/South American nations                                               |
| `Global`        | For publishers with no single national base (e.g., UN News)                      |

---

## The 9-Step Research Process

Execute these steps in order for every new publisher. Each step maps to specific template sections.

---

### Step 1 — Official Website (5 min)

Navigate to the publisher's website.

**Collect from About page:**

- Publisher name, headquarters, founding year
- Owner, parent company
- Editorial policy or ethics statement

**Collect from RSS/Feed page:**

- All available RSS/Atom feed URLs
- Feed categories (World, Business, Technology, etc.)

**Template sections filled:** `facts.identity`, `facts.ownership`, `feeds[]`

---

### Step 2 — Corporate Records & References (5 min)

Cross-reference ownership information.

**Sources:**

- Company registries (for publicly listed companies)
- Annual reports (if available)
- Encyclopaedia Britannica (for established publishers)

**Template sections filled:** `facts.ownership.parentOrganization`, `facts.identity.foundedYear` (verification)

---

### Step 3 — Wikipedia (As Discovery Only) (3 min)

Use Wikipedia as a **directory to find information**, not as a primary source.

**Use it to discover:**

- Parent companies and ownership history
- Notable acquisitions or controversies
- Links to official sources

**Then verify everything via official sources from Steps 1–2.**

---

### Step 4 — Editorial Policy Analysis (5 min)

Look for:

- Published editorial standards or ethics guidelines
- Corrections and retractions policy
- Disclosed conflicts of interest
- Separation of news and opinion

**Template sections filled:** `assessments.reliability`, `assessments.editorialOrientation`

---

### Step 5 — RSS Feed Validation (5 min)

For each feed URL:

```bash
curl -s "FEED_URL" | head -50
```

**Verify:**

- [ ] Feed returns valid XML (RSS 2.0 or Atom)
- [ ] Content is in English
- [ ] Feed updates at least daily (check `<pubDate>` timestamps)
- [ ] Articles have titles, URLs, and content snippets
- [ ] No geographic or IP-based access restrictions

**Template sections filled:** `feeds[]` (feedType, validation status)

---

### Step 6 — Article Sampling (10 min)

Read **20–30 articles** from the RSS feed. This is the most important step for observable metadata.

**While reading, note:**

| Observation                                              | Template Field                                         |
| -------------------------------------------------------- | ------------------------------------------------------ |
| What regions appear most?                                | `coverage.primaryRegions`, `coverage.secondaryRegions` |
| What topics dominate?                                    | `coverage.categoryStrengths`                           |
| Is the reporting original or syndicated?                 | `classifications.originality`                          |
| Is there an opinion/editorial section?                   | `classifications.editorialStyle`                       |
| How are international disputes framed?                   | `assessments.internationalAlignment`                   |
| What's the general tone — factual? analytical? advocacy? | `assessments.editorialOrientation`                     |
| What topics are conspicuously absent?                    | `intelligence.knownWeaknesses`                         |

Record the number of articles sampled in `research.researchNotes`.

---

### Step 7 — External Evaluators (5 min)

Check these databases. **Use what's available. Don't force it.**

| Database                  | URL                             | Best For                                    |
| ------------------------- | ------------------------------- | ------------------------------------------- |
| Media Bias/Fact Check     | https://mediabiasfactcheck.com  | Political leaning, factual reporting rating |
| Ad Fontes Media           | https://adfontesmedia.com       | Reliability + bias mapping                  |
| AllSides                  | https://allsides.com/media-bias | US-focused political leaning                |
| NewsGuard                 | https://newsguardtech.com       | Overall trust score (paywalled)             |
| Reporters Without Borders | https://rsf.org                 | Country-level press freedom context         |

**For APAC publishers:** Most will have no external rating. That's expected. Your own article sampling from Step 6 becomes the primary evidence, and your confidence score should reflect this (typically 0.50–0.70 for self-assessed subjective fields).

**Template sections filled:** `assessments.externalRatings`, `assessments.politicalLeaning`

---

### Step 8 — Write Summaries & Intelligence (10 min)

Now synthesize everything into the template's prose fields:

1. **`facts.identity.description`** — 2–3 sentence summary of who this publisher is
2. **`intelligence.knownPerspective`** — How this publisher typically frames events (this gets fed to the AI)
3. **`intelligence.knownStrengths`** — Topics they excel at
4. **`intelligence.knownWeaknesses`** — Gaps or blind spots
5. **`selectionRationale`** — Why this publisher belongs in the system
6. **`research.researchNotes`** — Anything unusual or notable from the research

**Critical:** Write the `selectionRationale` honestly. If you can't articulate why this publisher adds value to the catalog, reconsider adding it.

---

### Step 9 — Peer Review (After 1 Week)

Set a reminder to revisit the profile **at least 7 days later**.

**Review with fresh eyes:**

- Do the assessment values still feel right?
- Were any confidence scores too generous?
- Did you miss any ownership nuances?
- Does the `selectionRationale` still hold up?

Record the review date in `research.peerReviewDate`.

Set `research.status` to `ESTABLISHED` only after peer review is complete.

---

## Quality Gate

A publisher is ready for ingestion when:

- [ ] All Fact fields (identity, ownership) are verified from official sources
- [ ] All Classification fields use values from the Internal Taxonomy
- [ ] At least 20 articles have been sampled
- [ ] All Assessment fields have evidence, source, and confidence documented
- [ ] RSS feed(s) validated and returning content
- [ ] `selectionRationale` is written
- [ ] `intelligence.knownPerspective` is written (required for AI enrichment)
- [ ] `systemMapping` fields are filled (drives the current pipeline)
- [ ] `research.status` is `ESTABLISHED` (after peer review)

---

## Template & Profile Storage

**Canonical template:**  
[source-curation-template.json](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/5.%20feed-%26-metadata-specific/source-curation-template.json)

**Completed profiles:**

```
docs/2. my_notes_&_drafts/source-profiles/
├── nikkei-asia.json
├── channel-newsasia.json
├── abc-news-australia.json
└── ...
```

---

## Maintenance

Source profiles are **not static**. Schedule a review when:

- A publisher changes ownership
- An RSS feed URL changes or breaks
- External evaluators update their ratings
- Your pipeline detects anomalies (sudden volume change, language shift, extended downtime)

When updating, set `research.status` to `NEEDS_REVIEW`, make changes, then promote back to `ESTABLISHED` after verification.
