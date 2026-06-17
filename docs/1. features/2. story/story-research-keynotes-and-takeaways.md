# Story Research Keynotes and Takeaways

> **Relations:** See [0. story-clustering.md](0.%20story-clustering.md) for the feature overview, [Story clustering implementation plan - solving current problems](Story%20clustering%20implementation%20plan%20-%20solving%20current%20problems.md) for the implementation record and Phase 2 roadmap.
> **Source:** [Researching on story clustering - gemini then gist down by codex](Researching%20on%20story%20clustering%20-%20gemini%20then%20gist%20down%20by%20codex.md) — Raw Gemini conversation and agent summarization. This file is the synthesized takeaways; the raw file is kept as a reference for traceability.

This note captures the reasoning behind the next story-clustering decisions. It is intentionally broader than the implementation document so future changes do not lose the product logic, tradeoffs, and unresolved questions behind the feature.

---

## 1. Core Product Definition

A Story is an evolving real-world event thread, not a topic, category, country feed, or single article.

Good Story examples:
- `Iran and US resume indirect nuclear negotiations`
- `Bangladesh faces rising mob violence after political transition`
- `Russia launches renewed offensive near Kharkiv`
- `OpenAI prepares public market strategy after a major valuation jump`

Poor Story examples:
- `Iran`
- `US politics`
- `AI companies`
- `Donald Trump said something`
- `Bangladesh crime`

Key framing:
- Articles are evidence.
- Stories are surfaced event threads.
- Status describes narrative phase.
- Impact controls retention.
- Momentum controls ranking.
- Candidate detection controls LLM cost.

---

## 2. Current Structural Problems

The current implementation is workable for an MVP, but several mechanisms are tangled together:

- `48h HOLDING` window
- `3 article` critical mass threshold
- exact string entity overlap
- global top-30 active story context
- momentum-based decay and archival
- separate impact/time-based lifecycle

The biggest lifecycle problem is that momentum can archive a story even if impact-based retention says it should remain active. Product-wise, that creates a contradiction: a story can be marked important enough for long retention while a ranking signal still removes it.

Recommended direction:
- Lifecycle archival should be owned by impact/status/inactivity rules.
- Momentum should rank stories, not archive them.

---

## 3. Story Creation Rules

One creation rule is not enough. A strict `3 articles in 48h` rule catches breaking news, but misses low-volume strategic developments.

### Path A: Normal Breaking Story

Create a story when:
- 3+ related articles appear within 48h.
- Articles share canonical entities, location/event signals, or strong title/content similarity.
- At least 2 sources are involved.
- The articles describe the same event or direct continuation, not just the same broad topic.

Pros:
- Low duplicate risk.
- Good source diversity.
- Strong signal for high-volume events.

Cons:
- Misses slow-burn events.
- Can fail when entities are phrased differently.

### Path B: Slow-Burn Strategic Story

Create a story when:
- 2+ related articles recur across a longer window, such as 7-14 days.
- Entities, region, category, and event language recur.
- The subject has geopolitical significance.
- The articles are not just general commentary on a broad theme.

Pros:
- Supports the desired low-volume strategic-development use case.
- Better for diplomacy, sanctions, legal proceedings, border tensions, procurement, and institutional processes.

Cons:
- Requires careful candidate scoring.
- Higher risk of creating broad topic clusters unless event specificity is enforced.

### Path C: Single-Article Candidate

A single article should usually not become a surfaced story immediately. Instead, it can become a hidden/internal `CANDIDATE` if it has strong signals:
- high-impact geopolitical actors
- strong event language, such as "invades", "declares", "resigns", "passes", "ceasefire", "sanctions", "coup", "deal signed"
- high source credibility or strong source relevance
- clear event specificity
- not opinion-only or broad analysis

If another related article appears, promote it to a surfaced Story. If not, expire it.

Pros:
- Avoids missing important early developments.
- Prevents the frontend from filling with one-off articles.

Cons:
- Requires a candidate state or equivalent holding mechanism.
- Requires clear expiration rules.

---

## 4. Candidate Detection

Entity overlap alone is not enough. Articles can share actors but describe different events.

Example:
- `Trump comments on Iran`
- `Trump announces new sanctions on Iran`
- `Trump hosts Gulf leaders to discuss Iran`

These share entities, but they may be separate story threads.

Near-term candidate detection should use a hybrid score:

```text
candidateScore =
  canonicalEntityScore +
  eventPhraseScore +
  regionScore +
  categoryScore +
  titleSimilarityScore +
  recencyScore +
  sourceDiversityScore
```

Only candidates above a threshold should be sent to the LLM.

Important distinction:
- Candidate detection asks, "Is this related enough to evaluate?"
- The LLM asks, "Is this the same story, a new story, a candidate, or unclustered?"

---

## 5. Themes And Current Data Reality

The current article model does not store article-level `themes`.

Current usable article-level signals:
- `entities`
- `categories`
- `eventRegion`
- title/content text
- source metadata via the raw article/source model

Story-level `themes` exist on `StoryCluster`, but they are generated after a story exists. They should not be treated as a current prerequisite for article candidate detection.

Near-term recommendation:
- Use `entities + categories + eventRegion + title/content similarity`.

Possible future schema addition:

```prisma
model ProcessedArticle {
  themes String[]
}
```

Potential article themes:
- `sanctions`
- `ceasefire`
- `election`
- `military escalation`
- `trade dispute`
- `diplomatic talks`
- `civil unrest`
- `terror attack`
- `legal case`

---

## 6. Canonical Entities

Canonical entities are needed because exact string matching misses obvious matches:
- `Vladimir Putin`
- `Putin`
- `President Putin`

The system should not destructively rewrite or strip the original entity list. Preserve original entities and use normalized comparison keys for clustering.

Safe approach:
- Keep `entities` unchanged in the database.
- Normalize only for matching, or add a separate normalized field later.
- Use a small alias dictionary for obvious forms.
- Log overlap decisions so bad normalization rules can be caught.

Good normalization:
- trim whitespace
- lowercase for comparison
- normalize punctuation
- map obvious aliases: `U.S.`, `US`, `USA` -> `United States`
- map `UK`, `Britain` -> `United Kingdom`
- map `EU` -> `European Union`
- remove titles conservatively when followed by a name

Risky normalization:
- deleting generic words everywhere
- shortening every full name automatically
- fuzzy matching unrelated names
- assuming surnames are globally unique

Prompting should also improve entity extraction:

```text
Return canonical entity names, not aliases or titles.
Use "Vladimir Putin", not "Putin" or "President Putin".
Use "United States", not "US", "U.S.", or "America".
Use "European Union", not "EU".
For people, prefer full names when available.
For organizations and countries, prefer official/common canonical names.
```

Long-term mature model:

```prisma
model Entity {
  id            String   @id @default(uuid())
  canonicalName String
  aliases       String[]
  type          String?
}
```

---

## 7. Lifecycle Model

Status and impact should not mean the same thing.

Status describes narrative phase:
- `CANDIDATE`
- `EMERGING`
- `DEVELOPING`
- `ESCALATING`
- `SLOW_BURN`
- `STABLE`
- `RESOLVING`
- `ARCHIVED`

Impact describes importance:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Recommended retention model:

```js
const baseRetentionDays = {
  LOW: 7,
  MEDIUM: 14,
  HIGH: 30,
  CRITICAL: 60,
};

const statusMultiplier = {
  EMERGING: 0.75,
  DEVELOPING: 1,
  ESCALATING: 1.5,
  SLOW_BURN: 1.5,
  STABLE: 0.5,
  RESOLVING: 0.5,
};
```

Examples:
- `LOW + STABLE` archives quickly.
- `CRITICAL + SLOW_BURN` remains active much longer.
- `HIGH + ESCALATING` gets extended.
- `MEDIUM + RESOLVING` winds down.

This avoids false representation because the labels answer different questions:
- status: what phase is the story in?
- impact: how important is it?
- momentum: how prominent should it be now?
- lifecycle: should it still be active?

---

## 8. Active Story Limit And LLM Context

The system does not need to have only 30 active stories. It needs to avoid sending hundreds of stories to the LLM.

Separate these concepts:
- active in database
- visible on frontend
- included in LLM context

Possible model:
- 100-200 active/recent stories in the database
- 30 visible on the homepage or default story surface
- 20-40 relevant candidates passed to the LLM per article/group

Better LLM context rule:

```text
Send the top relevant candidate stories for this article/group, not the global top 30 stories.
```

Candidate story retrieval can use:
- canonical entity overlap
- region match
- category match
- title/content similarity
- recency
- impact/status priority

This reduces context pressure without forcing the product to archive useful stories too early.

---

## 9. Frontend Presentation

Recommended baseline:
- one main Story feed
- filters/tabs for status, impact, region, and theme/category
- highlight `CRITICAL` and `ESCALATING` stories near the top
- allow `SLOW_BURN` stories to remain findable without competing directly with breaking-news velocity

Possible sections:
- `Breaking / Escalating`
- `Developing`
- `Slow Burn`
- `Resolving`
- `Recently Archived`

The frontend should make story status useful for scanning, but the backend should not create fake status labels just to fill sections.

---

## 10. Duplicate Story Strategy

Duplicate stories are not useful. They split article evidence, confuse users, and make summaries weaker.

The tradeoff:
- stricter creation rules reduce duplicates but miss ambiguous/slow stories
- looser creation rules catch more stories but create duplicate cleanup work

Recommended bias:
- stricter surfaced story creation
- hidden candidate stories for uncertain cases
- post-run duplicate detection for newly created stories

Duplicate detection can compare:
- title similarity
- summary similarity
- canonical entity overlap
- event phrase overlap
- article overlap
- time window overlap

---

## 11. Recommended Implementation Order

1. Remove momentum-based archival; keep momentum for ranking only.
2. Improve entity extraction prompt to request canonical names.
3. Add conservative entity normalization for matching only.
4. Replace exact anchor-centric overlap with scored candidate detection.
5. Add slow-burn and candidate handling.
6. Change LLM context from global top 30 to relevant candidate stories.
7. Make lifecycle retention depend on impact + status + inactivity.
8. Add post-run duplicate detection for newly created stories.

---

## 12. Story Types and Their Lifecycle Shapes

Story type determines how a story behaves over time. Treating every cluster like short-lived breaking news causes both premature archival (for slow-burn stories) and context pollution (for evergreen content).

### 12.1 Breaking / Spot Story

A sudden event that spikes fast and decays fast.

- **Examples:** attack, resignation, disaster, launch, deal announcement, diplomatic statement, court verdict.
- **Usual lifecycle:** minutes/hours to 1-3 days.
- **Product handling:** surface quickly, rank by freshness/momentum, archive when inactive.
- **Risk:** high duplication — many sources rewrite the same wire story.

### 12.2 Slow-Burn Strategic Story

A low-volume but high-importance event thread that unfolds through institutions, negotiations, deadlines, filings, sanctions, military positioning, or long diplomatic processes.

- **Examples:** border tensions, sanctions enforcement, nuclear talks, WTO disputes, arms procurement, cyber campaigns, tribunal/legal cases.
- **Usual lifecycle:** weeks to months, sometimes years.
- **Product handling:** do not require 3 articles in 48h; use longer recurrence windows and timeline-style presentation.
- **Risk:** easy to accidentally create broad topic pages instead of event stories.

### 12.3 Investigative / Scoop Fallout Story

A major investigative article or leak that triggers follow-up coverage.

- **Examples:** corruption expose, leaked documents, state abuse investigation, corporate/government scandal.
- **Usual lifecycle:** initial spike, then follow-up reactions for days/weeks.
- **Product handling:** track the original investigation plus reactions, denials, resignations, inquiries, legal actions.
- **Risk:** the first article may be single-source, requiring a candidate/verification phase before surfacing.

### 12.4 Evergreen / Context Story

Background, profile, explainer, or long-term phenomenon coverage.

- **Examples:** "why this conflict matters", leader profile, historical explainer, demographic/social trend.
- **Usual lifecycle:** long shelf life but low breaking velocity.
- **Product handling:** use as context blocks attached to active stories, not as active headline stories.
- **Risk:** can pollute the story feed if mixed with active event threads.

### 12.5 Slow-Burn Lifecycle Phases

Slow-burn stories move through recognizable phases. The system should not treat phase transitions as failures — a story in stalemate is not the same as a resolving story.

1. **Incubation** — The issue exists but is mostly invisible. Signals appear in filings, specialist reports, niche sources, or small statements. System action: keep as candidate/internal evidence, not surfaced story.

2. **Friction** — The issue becomes public through a trigger: formal talks, sanctions proposal, legal filing, military movement, or public accusation. System action: a story can be created if at least one confirming signal appears.

3. **Stalemate / Escalation** — Longest phase. Activity is cyclical and milestone-based. Coverage may be low, but each update can be important. System action: retention must be longer than breaking news; timeline and key developments matter more than article count.

4. **Inflection / Resolution** — A deadline, ruling, clash, treaty, collapse, or settlement forces a major change. The slow-burn can temporarily become breaking news. System action: status may change from `SLOW_BURN` to `ESCALATING`, `DEVELOPING`, or `RESOLVING`.

5. **Aftermath** — The event stops producing frequent news, but consequences continue. System action: archive from the main feed but keep it queryable and attachable as context.

---

## 13. Product Design Implications

The aggregator's value is not only grouping similar articles. Its real value is turning repeated reporting into structured knowledge:

- **Synthesis** — Combine multiple reports into one readable state-of-story summary.
- **Timeline** — Show how the event evolved over time.
- **Perspective split** — Show how different regions/sources frame the same event.
- **Context buffer** — Explain background for users entering late.
- **Fallout tracker** — For investigations or major announcements, track responses and consequences.

This means the story page should not be just a list of articles. It should gradually become a structured event object.

---

## 14. Architectural Paths

The system should support multiple processing paths for different story behaviors:

- **Hot path** — Breaking stories, high velocity, short retention, homepage prominence.
- **Warm path** — Investigative/fallout stories, medium retention, reaction tracking.
- **Structural path** — Slow-burn stories, long retention, timeline/hub presentation.
- **Context path** — Evergreen explainers/profiles used as supporting material.

This does not require building four separate infrastructures immediately. For now, it means the story model and lifecycle logic should recognize story type/status so all stories are not treated like breaking news.

---

## 15. SimHash Note

SimHash may be useful for near-duplicate detection, but not for full story understanding.

**Good use cases:**
- Detect many rewrites of the same wire article.
- Collapse duplicate or highly similar articles inside a breaking story.
- Reduce repeated LLM input.
- Support "this is the same immediate event" detection for high-velocity news.

**Weak use cases:**
- Detecting slow-burn relations across different wording.
- Understanding that sanctions, talks, and military movement are part of one strategic thread.
- Distinguishing same-entity-but-different-event cases.

**Conclusion:** SimHash can be useful as a cheap duplicate/similarity signal, but it should not replace entity/event/region scoring or LLM story decisions.

---

## 16. Graph Database Note

A graph model would be useful later because stories are naturally relational:

- Article → Entity
- Article → Story
- Story → Entity
- Story → Region
- Story → Event milestone
- Story → Related story
- Entity → Entity relationship

This project probably does not need a separate graph database right now. PostgreSQL can support the next stage with relational tables, join tables, JSON fields, and later `pgvector` for similarity.

**Useful graph-style thinking now:**
- Model relationships clearly.
- Avoid treating story clustering as only one flat table.
- Consider future links between related stories, predecessor stories, and aftermath stories.

**Conclusion:** Graph thinking is valuable. Adopting a graph database is a later-scale decision.

---

## 17. Current Decision Bias

The product should be conservative about creating surfaced stories but generous about preserving meaningful low-volume geopolitical developments once they are created.

In short:

```text
Do not turn every article into a story.
Do not let important slow stories die just because they are quiet.
```
