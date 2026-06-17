# Story Clustering Implementation Plan - Solving Current Problems

> **Relations:** See [0. story-clustering.md](0.%20story-clustering.md) for the feature overview, [story-research-keynotes-and-takeaways.md](story-research-keynotes-and-takeaways.md) for the product reasoning, and [story-db-baseline-audit.md](story-db-baseline-audit.md) for the baseline audit script.

This note documents how to move from the current MVP story clustering system toward a more reliable event-story system. It focuses on the questions raised after the first implementation plan: ranking, relevance, deferred schema choices, fuzzy matching, and what should be documented for later.

---

## 1. Ranking Stories Without Letting Momentum Archive Them

Momentum can still be useful, but it should answer only one question:

> How prominent should this story be right now?

It should not answer:

> Should this story still be active?

Archival should be controlled by lifecycle rules based on impact, status, and inactivity.

### Ranking signals

A story can be ranked with a combined score:

```text
 impact weight
+ freshness / recency
+ new article velocity
+ source diversity
+ article count
+ status boost
+ momentum score
+ user/product priority later
```

Possible score:

```text
rankScore =
  impactScore * 4
+ recencyScore * 3
+ velocityScore * 2
+ sourceDiversityScore * 1.5
+ statusBoost
+ momentumScore * 0.2
```

### Signal meanings

**Impact score**
- `CRITICAL = 4`
- `HIGH = 3`
- `MEDIUM = 2`
- `LOW = 1`

This prevents a low-impact but noisy story from always beating a high-impact strategic story.

**Recency score**
- Based on `lastActivityAt`.
- High when the story received new articles recently.
- Decays with time, but does not archive the story.

**Velocity score**
- Measures article arrival rate over a short window, such as last 6h, 12h, or 24h.
- Useful for breaking/hype detection.
- This can be approximated later from story article timestamps.

**Source diversity score**
- Higher when multiple sources cover the same story.
- Helps avoid overranking one-source repetition.

**Status boost**
- `ESCALATING` gets a boost.
- `DEVELOPING` gets normal weight.
- `SLOW_BURN` gets enough support to avoid disappearing just because velocity is low.
- `STABLE` and `RESOLVING` rank lower unless impact is high.

**Momentum score**
- Can remain as a lightweight memory of recent activity.
- It should be capped and decay slowly.
- It should not set `isActive = false`.

### Recommendation

Keep momentum only as one ranking input. The primary ranking should be computed from explainable fields: impact, recency, velocity, status, article count, and source diversity.

---

## 2. Relevance For LLM Candidate Stories

The system should not send the global top 30 active stories to the LLM. It should send the top 30 stories most relevant to the current article group.

This solves two problems:

- The DB can keep more than 30 active stories.
- The LLM context stays small because it only sees likely matches.

### What is being measured?

When clustering a new article group, measure relevance between:

- the new article/group
- each active/recent story cluster

The goal is not to prove a match. The goal is to select likely candidates for the LLM to evaluate.

### Relevance signals

```text
relevanceScore =
  entityOverlapScore
+ regionOverlapScore
+ categoryOrThemeScore
+ titleSummarySimilarityScore
+ recencyCompatibilityScore
+ impactPriorityScore
+ statusCompatibilityScore
```

### Entity overlap

Compare normalized entities from the article group with normalized entities from recent articles already attached to the story, and optionally story title/summary/themes.

Example:

```text
article group: ["United States", "Iran", "Nuclear Talks"]
story: "Iran and US resume indirect nuclear negotiations"
```

This should rank highly.

### Region overlap

If the new group and story both involve the same region/country, add score.

This is not enough by itself. `Iran` + `Middle East` can still represent many different stories.

### Category/theme overlap

Current article-level data has `categories`, not true article-level `themes`.

For now:

- use article `categories`
- use `eventRegion`
- use story `themes` only as a weak supporting signal

Later:

- add article-level `themes` or `eventTags`

### Title/summary similarity

Use simple text similarity first:

- shared important words
- shared event terms
- maybe trigram/Jaccard similarity

Later:

- use embeddings or `pgvector`

### Recency compatibility

Recent stories should be easier to match.

Older stories can still match, but only if the entity/event overlap is strong. This prevents old broad stories from absorbing unrelated current articles.

### Impact priority

Higher-impact stories can receive a small relevance boost so they are considered even when velocity is lower.

This matters for slow-burn geopolitical developments.

### Status compatibility

`DEVELOPING`, `ESCALATING`, and `SLOW_BURN` stories should remain good candidates.

`STABLE` and `RESOLVING` stories should require stronger evidence before being sent to the LLM.

### Recommendation

Implementation should load more active/recent stories, score them locally against the current group, sort by relevance, and send only the top 30 to the LLM.

---

## 3. Deferred Schema Choice: `storyType`

There are two ways to represent story kind:

### Option A: Use `status` only for now

Statuses:

```text
EMERGING
DEVELOPING
ESCALATING
SLOW_BURN
STABLE
RESOLVING
ARCHIVED
```

Pros:
- no schema migration
- quick to implement
- enough for lifecycle experiments
- less surface area for the LLM to get wrong

Cons:
- status mixes story phase and story kind
- `SLOW_BURN` is more of a story behavior/type than a pure lifecycle phase

### Option B: Add `storyType` later

Possible values:

```text
BREAKING
SLOW_BURN
INVESTIGATIVE_FALLOUT
CONTEXT
```

Then status can remain phase-oriented:

```text
EMERGING
DEVELOPING
ESCALATING
STABLE
RESOLVING
ARCHIVED
```

Pros:
- cleaner model
- better frontend filtering
- better lifecycle rules
- easier to distinguish "what kind of story is this?" from "what phase is it in?"

Cons:
- requires schema migration
- requires prompt/schema updates
- adds another field the LLM can misclassify
- may be premature before the story behavior is proven

### Recommendation

Use `status` only in the next implementation pass. Document `storyType` as a later improvement once the system has enough real clusters to justify the extra field.

---

## 4. Conservative Entity Normalization Now

The near-term entity approach should preserve original entities and compute normalized comparison keys only for matching.

Do not destructively rewrite:

```text
["President Putin", "U.S.", "Kremlin"]
```

Instead compare with:

```text
["putin", "united states", "kremlin"]
```

### Safe normalization

- lowercase
- trim whitespace
- normalize punctuation
- map obvious aliases:
  - `US`, `U.S.`, `USA` -> `united states`
  - `UK`, `Britain` -> `united kingdom`
  - `EU` -> `european union`
- remove titles only at the start:
  - `President Putin` -> `putin`
  - `Prime Minister Modi` -> `modi`

### Risky normalization

- removing generic words everywhere
- reducing every full name to surname
- fuzzy matching names without type/context
- assuming surnames are globally unique

### Recommendation

Use conservative normalization for the first fix. Log why articles matched so bad rules can be found.

---

## 5. Fuzzy Matching Later

Fuzzy matching means allowing near matches instead of exact string matches.

Examples:

```text
"Vladimir Putin" ~= "Putin"
"U.S." ~= "United States"
"European Union" ~= "EU"
"Benjamin Netanyahu" ~= "Netanyahu"
```

But fuzzy matching can also create bad matches:

```text
"Georgia" country vs "Georgia" US state
"Jordan" person vs "Jordan" country
"Trump administration" vs "Donald Trump"
"Khan" as different people
```

### Ways to implement fuzzy matching

**1. Alias dictionary**

Manually map obvious aliases.

Best for:
- countries
- major organizations
- common abbreviations

Pros:
- predictable
- easy to debug
- low false-positive risk

Cons:
- limited coverage
- needs maintenance

This is the best first step.

**2. String similarity**

Use algorithms such as:

- Levenshtein distance
- Jaro-Winkler
- token-set ratio
- trigram similarity

Best for:
- typos
- punctuation differences
- minor spelling variants

Pros:
- catches small text differences

Cons:
- dangerous for short names
- can match unrelated entities
- needs thresholds and entity type awareness

Use only after alias dictionary and logging exist.

**3. Entity table with aliases**

Create a real entity model:

```prisma
model Entity {
  id            String   @id @default(uuid())
  canonicalName String
  aliases       String[]
  type          String?
}
```

Then articles can connect to canonical entities.

Pros:
- most controlled long-term solution
- supports aliases, types, and cross-language matching
- improves story relevance scoring

Cons:
- schema and migration work
- needs entity resolution logic
- more operational complexity

This is likely the mature solution.

**4. Embeddings**

Use embeddings to compare entity phrases or article/story text.

Best for:
- semantic similarity
- article-to-story relevance
- slow-burn detection across different wording

Pros:
- handles meaning better than strings

Cons:
- cost
- vector storage/querying
- less explainable than aliases

Better for article/story similarity than entity identity at first.

**5. LLM entity canonicalization**

Ask the LLM to return canonical names during enrichment.

Pros:
- easy to add to prompt
- improves data quality early

Cons:
- not deterministic
- model can be inconsistent
- still needs code-side normalization and validation

Good as a supporting layer, not the only layer.

### Recommendation

Fuzzy matching should be introduced in this order:

1. alias dictionary
2. conservative code normalization
3. LLM canonical entity prompting
4. entity match logging
5. string similarity for longer names only
6. entity table with aliases
7. embeddings for article/story similarity

Do not start with broad fuzzy matching. It will create false story merges.

---

## 6. What Should Be Kept For Later

These are intentionally deferred and should not be forgotten:

### `storyType`

Reason deferred:
- `status` can carry the first implementation.
- Avoid schema migration until real cluster behavior proves the need.

When to add:
- when frontend needs clear filters like Breaking, Slow-Burn, Investigative Fallout, Context.
- when lifecycle rules become awkward with status alone.

### Article-level `themes` or `eventTags`

Reason deferred:
- current article model does not store themes.
- categories, eventRegion, entities, and text similarity are enough for the next pass.

When to add:
- when candidate scoring needs better distinction between sanctions, elections, talks, protests, legal cases, etc.

### Fuzzy matching beyond aliases

Reason deferred:
- false positives can merge unrelated stories.
- exact plus normalized matching should be measured first.

When to add:
- after match logs show repeated misses caused by spelling/name variation.

### SimHash

Reason deferred:
- useful for near-duplicate detection, not event understanding.

When to add:
- when repeated wire-style articles are wasting LLM context.

### Graph database

Reason deferred:
- relational Postgres can support the next phase.
- graph thinking is useful now, but graph infrastructure is not yet required.

When to add:
- only if relationship traversal becomes a core product feature and relational queries become too painful.

### Embeddings / `pgvector`

Reason deferred:
- requires storage, generation, and query changes.
- local scoring can improve quality first.

When to add:
- when title/entity/category scoring is not enough for slow-burn and cross-wording similarity.

---

## 7. Concrete Near-Term Implementation Plan

1. Remove momentum-based archival.
2. Replace hard DB-level Top 30 archival with frontend/LLM candidate selection.
3. Expand allowed statuses to include `EMERGING`, `SLOW_BURN`, and `ARCHIVED`.
4. Add conservative entity normalization helpers.
5. Replace anchor-centric grouping with connected-components grouping.
6. Add local relevance scoring for article-group to story-cluster selection.
7. Use relevant top 30 clusters in the LLM prompt.
8. Adjust lifecycle retention to use impact + status + inactivity.
9. Keep deferred items documented until the current fixes produce real behavior to evaluate.

---

## 8. Design Principle

The system should separate four decisions:

```text
creation: should this become a story?
lifecycle: should this story remain active?
ranking: how prominent should this story be?
LLM context: which existing stories are relevant enough to compare?
```

The current implementation mixes these decisions. The next implementation should separate them without rewriting the whole pipeline.

---

## 9. Implemented Phase 1

The first implementation pass applies the low-risk fixes without a Prisma migration.

### Changed in code

- Momentum still increments/decrements, but it no longer archives stories.
- The hard database-level Top 30 archival rule was removed.
- The frontend ranks active stories and shows the top 30 by impact, recency, source diversity, article count, and momentum.
- The LLM receives the top relevant candidate stories for each article batch, not the global top 30.
- The holding window is configurable with `CLUSTER_HOLDING_WINDOW_HOURS`; default is now 168 hours.
- Entity matching now uses conservative normalized comparison keys while preserving original entity strings.
- Entity grouping now uses connected components instead of anchor-centric grouping.
- Allowed statuses now include `EMERGING` and `SLOW_BURN`.
- New-cluster LLM output is sanitized before database writes.

### Still intentionally deferred

- No `storyType` schema field yet.
- No broad fuzzy matching yet.
- No article-level themes/event tags yet.
- No embeddings or `pgvector` yet.
- No graph database changes.

### Important behavior after this pass

Stories can remain active in the database beyond the frontend's visible top 30. Lifecycle should decide archival; ranking decides visibility; relevance scoring decides LLM context.

---

## 10. Phase 2 Roadmap — Candidate Stories & Smarter Detection

Phase 2 extends the Phase 1 foundation by adding hidden candidate stories, article-level themes, post-run duplicate detection, and conservative fuzzy matching. These are the logical next steps — each builds on Phase 1 without requiring a full rewrite.

### 10.1 Hidden Candidate Stories

**Problem:** A single high-significance article (investigative scoop, major leak, sudden policy shift) cannot become a story today because `detectEntityOverlap` requires 3+ articles. The article remains in HOLDING until it ages into `ARCHIVED_UNCLUSTERED`, or it requires a completely separate article to confirm it.

**Possible approach:**
- Add an internal `CANDIDATE` state to `ProcessedArticle.clusterStatus` for articles that have strong event signals but no confirming article yet.
- A candidate becomes a surfaced Story when 1+ additional articles overlap with it within an extended window (e.g., 7-14 days).
- Candidates are surfaced in the UI only in a secondary area — not the main story feed.
- If no confirming article arrives, the candidate expires silently (transition to `ARCHIVED_UNCLUSTERED`).

**Single-article signals to detect:**
- High-impact entities (state leaders, major geopolitical actors)
- Strong event language: `invades`, `declares`, `resigns`, `ceasefire`, `sanctions`, `coup`, `deal signed`
- High source credibility
- Clear event specificity (not opinion or broad analysis)

**Risks:**
- Too many candidates polluting the holding tank if the signal threshold is too low.
- Candidate-to-story promotion flooding the LLM with creation requests.

**Recommendation:** Add this behind an env toggle (`CLUSTER_CANDIDATE_ENABLED`) and start with a very high signal bar. Measure how many candidates get promoted vs. expire before tuning.

### 10.2 Article-Level `themes` / `eventTags`

**Problem:** Candidate detection currently relies on `categories`, `eventRegion`, `entities`, and title/content similarity. But categories are too broad — `Politics`, `World`, `Business` — to distinguish between a sanctions story and an election story in the same region.

**What to add:**
```prisma
model ProcessedArticle {
  themes String[]
}
```

**When to extract:**
- During AI enrichment (in the same LLM call that extracts entities and sentiment).
- Potential values: `sanctions`, `ceasefire`, `election`, `military escalation`, `trade dispute`, `diplomatic talks`, `civil unrest`, `terror attack`, `legal case`, `cyber attack`, `humanitarian crisis`.

**How it improves scoring:**
- Article-theme to story-theme overlap becomes a stronger candidate signal than category overlap alone.
- Helps distinguish concurrent stories in the same region with different event types.

**Risks:**
- Adds LLM output complexity and potential inconsistency.
- Schema migration required.

**Recommendation:** Add to the enrichment prompt first (output-only, no schema change). Observe consistency. Then migrate schema to persist.

### 10.3 Post-Run Duplicate Detection

**Problem:** The LLM is instructed to avoid duplicate clusters, but it sometimes creates them anyway — especially when the same event appears with different entity phrasing or across batch boundaries.

**Approach:**
After each clustering run, compare newly created stories against all active stories:
- Title similarity (token overlap or trigram)
- Summary similarity
- Entity overlap
- Article overlap
- Time window overlap

If a new story is a near-duplicate of an existing active story, merge them: move the new story's articles to the existing story, archive the new story, and log the merge reason.

**Risks:**
- False merges if similarity thresholds are too low.
- Merging stories that share entities but describe different events.

**Recommendation:** Start with logging-only mode. Log potential merges without executing them. Review false-positive rate before enabling auto-merge.

### 10.4 Fuzzy Matching Beyond Aliases

**Problem:** The alias dictionary (`U.S.` → `United States`) covers common cases, but misses variations like `Vladimir Putin` vs. `Putin`, `Benjamin Netanyahu` vs. `Netanyahu`, or `UK` vs. `United Kingdom of Great Britain`.

**What to add (conservatively, in order):**

1. **LLM canonical entity prompting** — Update the enrichment prompt to return canonical entity names (e.g., `"Vladimir Putin"` not `"Putin"` or `"President Putin"`). This is the highest-leverage change with zero schema risk.
2. **Surname fallback for person entities** — If a canonical entity is a known person (detected by LLM-provided type or by heuristic), allow matching on surname only when the full name is not available in the comparison entity set.
3. **String similarity for multi-word entities** — Apply Jaccard or token-set ratio for entities longer than 10 characters. Set a high threshold (e.g., >0.85) to avoid false matches.
4. **Entity match logging** — Log all entity overlap decisions (which entities matched, which normalization rule was applied) so bad rules can be found and tuned.

**Risks:**
- Surname matching can conflate different people who share a surname.
- String similarity can match unrelated entities if the threshold is too low.

**Recommendation:** Start with LLM canonical prompting only. Add surname fallback and string similarity after match logs show concrete miss patterns.

### 10.5 Status-Based Lifecycle Tuning with Phase 1 Data

**Problem:** The Phase 1 lifecycle defaults (`LOW=10d`, `MEDIUM=21d`, `HIGH=35d`, `CRITICAL=60d`) are educated guesses. After enough clustering runs produce real stories, these values should be tuned based on observed behavior.

**What to measure:**
- Average time between article additions for SLOW_BURN stories vs. BREAKING/EMERGING.
- Distribution of article counts per story by impact level.
- How often `REOPENED` (or re-activation) happens for ARCHIVED stories — if it's frequent, the retention windows may be too aggressive.
- How many stories reach `RESOLVING` vs. being forcefully archived by inactivity.

**What to tune:**
- Holding window currently at 168h default — may need to be shorter for high-volume events and longer for slow-burn.
- Status multipliers for lifecycle retention (from the research: EMERGING=0.75, DEVELOPING=1, ESCALATING=1.5, SLOW_BURN=1.5, STABLE=0.5, RESOLVING=0.5).
- Min group size ([`CLUSTER_MIN_GROUP_SIZE`]) — keeping at 3 for now, but may want 2 for CRITICAL-impact articles.

**Recommendation:** Log story-age and activity metrics per run. After 2-4 weeks of real data, review and adjust defaults.

### 10.6 Phase 2 Scope Boundaries

| Item | In Scope | Out of Scope |
|------|----------|--------------|
| Hidden candidate story state | Candidate creation and silent expiration | Candidate-priority boosting for LLM context |
| Article-level themes | Add to enrichment prompt first; schema migration deferred | Backfilling themes for existing articles |
| Post-run duplicate detection | Logging-only mode; review false positives | Auto-merge without human validation |
| Fuzzy matching | LLM canonical prompting; entity match logging | Embeddings; `pgvector`; graph database |
| Lifecycle tuning | Metric logging; default review after 2-4 weeks | Dynamic auto-tuning |
| `storyType` field | Still deferred to Phase 3 | Schema migration |
| Broad fuzzy matching | Still deferred | Beyond LLM prompting + surname fallback |

### 10.7 Phase 2 Implementation Order

1. Add LLM canonical entity prompting to enrichment (highest leverage, zero schema risk).
2. Add article-level `themes` extraction to enrichment prompt (output-only initially).
3. Implement hidden candidate story state (new `clusterStatus`, candidate creation rules, candidate-to-story promotion).
4. Add entity match logging (log which normalization rules produced overlaps).
5. Implement post-run duplicate detection in logging-only mode.
6. Add surname fallback + conservative string similarity for entity matching.
7. Review lifecycle metric data after 2-4 weeks of real runs; tune defaults.
8. Migrate schema for article-level `themes` after observing prompt consistency.
9. Evaluate whether `storyType` field is needed based on real story behavior.
