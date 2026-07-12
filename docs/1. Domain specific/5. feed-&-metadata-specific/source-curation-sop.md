# Source Curation Standard Operating Procedure (SOP)

> **Status:** Active  
> **Version:** 1.0  
> **Last Updated:** 2026-07-12

---

## Purpose

Every news publisher added to the Global News Aggregator must pass through a structured research phase before it is considered "established." This SOP defines the repeatable methodology for gathering, verifying, and recording publisher metadata.

The base metadata profile is the vetting artifact itself. Once complete, the source is established — meaning a human has done due diligence and every field is either verified or explicitly marked as uncertain.

---

## Evidence Levels

Not all metadata carries equal confidence. Every field falls into one of four evidence levels:

### Level 1 — Objective Facts (Confidence: ~1.0)

Fields with a single correct answer. These are never contested.

| Examples | Verification Source |
|---|---|
| Publisher name, Website, RSS feed URL | Official website |
| Headquarters / Publisher country | Official About page, company registry |
| Owner, Parent company | Official website, annual reports |
| Founded year | Official website, Encyclopaedia Britannica |
| Language | Observable |

### Level 2 — Verifiable Descriptions (Confidence: 0.95–0.99)

Not opinions, but classifications that can be confirmed from public statements.

| Examples | Verification Source |
|---|---|
| Publisher type (Newspaper, Wire Service, Broadcaster) | Official About page |
| Coverage scope (National, International) | Editorial page, content sampling |
| Ownership type (Commercial, State, Public Service) | Official website, government records |

### Level 3 — Observable Characteristics (Confidence: 0.80–0.95)

Not stated directly, but measurable by sampling content.

| Examples | Verification Source |
|---|---|
| Category strengths (Business, Technology, etc.) | Sample 20–30 articles from RSS |
| Primary coverage regions | Analyze article distribution by geography |
| Publishes opinion (yes/no) | Check for opinion/editorial section |
| Original reporting (yes/no) | Read 10+ articles for original sourcing |

### Level 4 — External Assessments (Confidence: 0.50–0.80)

Subjective evaluations. **Never invent these.** Always attribute them.

| Examples | Verification Source |
|---|---|
| Political leaning | Ad Fontes Media, MBFC, AllSides |
| Editorial orientation | Editorial policy + article sampling |
| Reliability rating | NewsGuard, MBFC |
| Economic perspective | Article sampling + editorial analysis |

> **Critical Rule:** For Level 4 fields, store the *source of the assessment*, not just the value. Your database should say "Ad Fontes classifies Reuters as centrist" — not "Reuters is centrist."

---

## Research Checklist (Per Publisher)

Execute these steps in order for every new source. Each step maps to specific template fields.

### Step 1 — Official Website (5 min)

Visit the publisher's website. Navigate to:
- **About page** → `name`, `website`, `description`, `owner`, `foundedYear`, `publisherType`
- **Contact/Headquarters** → `publisherCountry`
- **RSS page** → `rssFeedUrl`, `feedType`
- **Editorial/Ethics page** → `factCheckingPolicy`, `correctionsPolicy`, `editorialIndependence`

### Step 2 — Wikipedia & Reference Lookup (5 min)

Use Wikipedia as a **directory**, not a source of truth.

- Verify or discover → `owner`, `parentOrganization`, `foundedYear`, `ownershipStructure`
- Cross-reference with Encyclopaedia Britannica or company registries
- Note any notable acquisitions or ownership changes

### Step 3 — Ownership & Funding Analysis (3 min)

Determine:
- Is this **state-funded**? Check government budget documents or official disclosures
- Is this a **public broadcaster**? (Editorially independent but government-funded, e.g., BBC, ABC Australia)
- Who is the **ultimate beneficial owner**? (e.g., SCMP → Alibaba → Jack Ma)

Map to → `ownershipType`, `owner`, `ownershipStructure`, `stateFunded`, `publicBroadcaster`

### Step 4 — Content Sampling (10 min)

Read **20–30 articles** from the RSS feed. Note:

- What **regions** do they cover most? → `primaryCoverage`, `secondaryCoverage`
- What **categories** dominate? → `categoryStrengths`
- Do they publish **opinion pieces**? → `publishesOpinion`
- Is the reporting **original** or mostly wire syndication? → `originalReporting`
- What is the **general framing**? → `knownPerspective`
- What topics are **conspicuously absent**? → `knownWeaknesses`

### Step 5 — External Evaluators (5 min)

Check these databases for subjective assessments. Only use what's available:

| Database | URL | Coverage |
|---|---|---|
| **Media Bias/Fact Check (MBFC)** | https://mediabiasfactcheck.com | Broad, mostly English-language |
| **Ad Fontes Media** | https://adfontesmedia.com | US-heavy but expanding |
| **AllSides** | https://allsides.com/media-bias | US-focused |
| **NewsGuard** | https://newsguardtech.com | Paywalled, but ratings are cited elsewhere |
| **Reporters Without Borders** | https://rsf.org | Country-level press freedom, not publisher-level |

Map findings to → `politicalLeaning`, `editorialOrientation`, `economicPerspective`, `mbfcRating`, `newsGuardScore`, `adFontesRating`

If no external rating exists, record your own assessment based on Step 4 sampling, but mark confidence accordingly (typically 0.50–0.70).

### Step 6 — System Mapping (2 min)

Map the researched metadata to the fields your current `FeedSource` schema requires:

| Template Field | Maps To |
|---|---|
| `publisherType` + `ownershipType` | `sourceType` (e.g., "Commercial Publisher", "State Media") |
| `editorialOrientation` + `politicalLeaning` | `biasGroup` (e.g., "Centrist", "State-Aligned") |
| `coverageScope` | `coverageScope` (e.g., "National", "Global") |

### Step 7 — Log & Finalize (3 min)

Fill the `researchLog` section of the template:
- Record all evidence sources with URLs
- Record confidence scores for each subjective field
- Set `status` to `ESTABLISHED`
- Write brief research notes capturing anything unusual

---

## Template Location

The canonical JSON template with a filled demo (Nikkei Asia) is at:

**[source-curation-template.json](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/1.%20Domain%20specific/5.%20feed-%26-metadata-specific/source-curation-template.json)**

When researching a new publisher, copy this template and fill it out. Store completed profiles in:

```
docs/2. my_notes_&_drafts/source-profiles/
├── nikkei-asia.json
├── channel-newsasia.json
├── abc-news-australia.json
└── ...
```

---

## Quality Gate

A source is **not** ready for ingestion until:

- [ ] All Level 1 fields (identity, ownership) are verified
- [ ] All Level 2 fields (publisher profile) are confirmed
- [ ] At least 20 articles have been sampled for Level 3 fields
- [ ] Level 4 fields either have external citations OR explicit "self-assessed" confidence scores
- [ ] `researchLog.status` is set to `ESTABLISHED`
- [ ] `systemMapping` fields are filled (these drive the pipeline)

---

## Maintenance

Source profiles are **not static**. Schedule a review when:

- A publisher changes ownership (e.g., SCMP sold by Alibaba)
- A publisher's RSS feed URL changes or breaks
- External evaluators update their ratings
- Your pipeline detects anomalies (sudden content volume change, language shift)

When updating, add a new entry to `researchLog.evidenceSources` with the updated field and date.
