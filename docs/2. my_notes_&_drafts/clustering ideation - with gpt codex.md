# Reference
**Branching out files**
- 

**In article clarifications**
- [Theme matching](#Theme%20matching)
- [Entity normalization](#Entity%20normalization)
- 


---

Your notes clarify the product direction well. The most important thing is this:

> You do **not** want “article clusters.” You want **event stories**.

That means the system should be conservative about creating stories, but generous about keeping meaningful low-volume stories alive once created.

Here is how I would define the feature going forward.

**1. What Is A Story?**

A Story should be:

> A continuing real-world event, crisis, negotiation, campaign, conflict, scandal, institutional process, disaster, or social phenomenon that receives repeated reporting over time.

A Story is not:
- one article
- a broad topic
- a category
- a country feed
- a general theme like “AI” or “Middle East”
- every repeated mention of the same person

Examples:

Good stories:
- `Iran and US resume indirect nuclear negotiations`
- `Bangladesh faces rising mob violence after political transition`
- `Russia launches renewed offensive near Kharkiv`
- `OpenAI prepares public market strategy after major private valuation jump`

Bad stories:
- `Iran`
- `US politics`
- `AI companies`
- `Donald Trump said something`
- `Bangladesh crime`

So your story system needs to answer one question before creation:

> Is this an event thread that a user may want to follow across multiple articles?

**2. Story Creation Rules**
I would not rely on only one rule like “3 articles in 48h.” That catches breaking news, but misses slow-burn geopolitical stories.

Use multiple creation paths.

**Path A: Normal breaking story**

Create a story when:
- 3+ articles appear within 48h
- they share canonical entities / event terms / location / theme
- at least 2 different sources are involved
- the articles describe the same event or direct continuation

This is your default path.

**Path B: Slow-burn strategic story**

Create a story when:
- 2+ related articles appear across 7-14 days
- entities/themes recur
- the topic has geopolitical significance
- the story is not just general commentary

Example: ongoing border negotiations, sanctions enforcement, diplomatic exchanges, fragile ceasefire talks.

This is important for your use case.

**Path C: High-significance single article candidate**
I agree with your hesitation: one article usually should **not** immediately become a public story.

Instead, I would create a hidden/internal state:

- `CANDIDATE_STORY`

A single article can become a candidate if it has strong signals:

- major trusted/source-diverse publisher
- high-impact category/entity
- strong event language: “launches,” “invades,” “declares,” “resigns,” “passes bill,” “ceasefire,” “sanctions,” “coup,” “explosion,” “deal signed”
- mentions important geopolitical actors
- not opinion/analysis-only

Then it waits for confirmation. If another related article appears, promote it to a real Story. If not, expire it.

So the answer is: **one article can be a candidate, but usually not a surfaced story.**

**3. Best Clustering Flow**

I would structure the pipeline like this:
1. **Ingest article**
   Save raw article.
2. **Enrich article**
   Extract category, canonical entities, regions, themes, event phrases, article type, and importance signals.
3. **Candidate matching**
   Check whether the article matches:
   - an existing active story
   - an inactive but recent archived story
   - a candidate story
   - other HOLDING articles
1. **Candidate grouping**
   Build possible groups using:
   - canonical entity overlap
   - event phrase overlap
   - title/content similarity
   - region/theme/category match
   - time proximity
   - source diversity
1. **LLM decision**
   LLM should decide:
   - attach to existing story
   - create new story
   - create candidate story
   - leave as unclustered
   - split because it is a different event
1. **Story metadata update**
   LLM writes or updates title, summary, why it matters, impact, status, developments.
2. **Lifecycle pass**
   Separate system decides whether stories remain active, become stable/resolving, or archive.

The key improvement: candidate detection should happen before the LLM, but final story meaning should be decided by the LLM.

**4. Candidate Detection**
The best practical approach for your current system is hybrid scoring.

For each article pair or article-to-story comparison, calculate a score:

```js
score =
  entityScore +
  eventPhraseScore +
  regionScore +
  themeScore +
  titleSimilarityScore +
  sourceDiversityScore +
  recencyScore
```

Then only send strong candidates to the LLM.

Entity overlap alone is too weak. You need canonical entities plus event-level clues.

For example, these may share entities but should not always be the same story:

- `Trump comments on Iran`
- `Trump announces sanctions on Iran`
- `Trump hosts Gulf leaders to discuss Iran`

Same actors, different event threads.

So candidate detection should ask:

> Are these articles about the same development, or just the same actors/topic?

**5. Canonical Entities**
You are right: canonical entities cannot be manually listed like categories.

Use three layers.

First, prompt the LLM better:

```text
Return canonical entity names, not aliases or titles.
Use "Vladimir Putin", not "Putin" or "President Putin".
Use "United States", not "US", "U.S.", or "America".
Use "European Union", not "EU".
For people, prefer full names.
For organizations and countries, prefer official/common canonical names.
```

Second, normalize in code:
- lowercase comparison
- remove titles like president, prime minister, foreign minister
- normalize punctuation
- map common aliases: `US`, `U.S.`, `USA` → `United States`
- map `UK`, `Britain` → `United Kingdom`
- map `EU` → `European Union`

Third, maintain an entity table later:
```prisma
Entity {
  id
  canonicalName
  aliases
  type
}
```

You do not need this on day one, but that is the mature version.

For now: **LLM prompt + code normalization + small alias dictionary** is enough.

**6. Lifecycle Model**

Your current instinct is right:
> Status describes narrative state. Impact controls retention.

I would use these statuses:
- `CANDIDATE`
- `EMERGING`
- `DEVELOPING`
- `ESCALATING`
- `SLOW_BURN`
- `STABLE`
- `RESOLVING`
- `ARCHIVED`

Impact:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Then retention can be calculated like this:

```js
baseRetention = {
  LOW: 7,
  MEDIUM: 14,
  HIGH: 30,
  CRITICAL: 60,
};

statusMultiplier = {
  EMERGING: 0.75,
  DEVELOPING: 1,
  ESCALATING: 1.5,
  SLOW_BURN: 1.5,
  STABLE: 0.5,
  RESOLVING: 0.5,
};
```

So:
- `LOW + STABLE` archives quickly
- `CRITICAL + SLOW_BURN` stays alive longer
- `HIGH + ESCALATING` gets extended
- `MEDIUM + RESOLVING` winds down

Momentum should only rank stories. It should not archive them.

**7. Active Story Limit**
You are right that you cannot send hundreds of stories to the LLM.

But that does not mean the system can only have 30 active stories.

Separate these concepts:
- **active in database**
- **visible on frontend**
- **included in LLM context**

You can have:
- 200 active/recent stories in DB
- 30 visible on homepage
- 20-40 selected as LLM candidates per article/group

The LLM does not need all stories. It needs the most likely matching stories.

So instead of “Top 30 active stories globally,” use:
> “Top 30 relevant candidate stories for this article/group.”

That candidate list can be selected by entity/theme/region/similarity before calling the LLM.

This is a major design improvement.

**8. Frontend Presentation**
Two good options:

Option A: grouped sections
- `Breaking / Escalating`
- `Developing`
- `Slow Burn`
- `Resolving`
- `Recently Archived`

Option B: one main story feed with filters
- sort by `Momentum`
- filter by `Status`
- filter by `Impact`
- filter by `Region`
- filter by `Theme`

My recommendation: use **one main feed**, with status tabs or filters. Then highlight `Escalating` and `Critical` stories at the top.

**9. Duplicate Stories**

You do not want duplicate stories. They do not serve you.

The tradeoff is this:
- strict creation rules = fewer duplicates, more missed stories
- loose creation rules = more captured stories, more duplicates

For your product, I would prefer:
> slightly stricter story creation, plus candidate stories for uncertain cases.

That avoids polluting the frontend while still preserving possible slow-burn stories.

**My Recommended Next Design**

If I were implementing the next version, I would do it in this order:
1. Remove momentum-based archiving.
2. Add canonical entity extraction prompt.
3. Add entity normalization in code.
4. Replace exact overlap grouping with scored candidate detection.
5. Add `CANDIDATE` / slow-burn handling.
6. Change LLM context from global top 30 to relevant top 30.
7. Add lifecycle retention based on `impact + status`.
8. Add duplicate detection after story creation.

The core product definition should be:

> Stories are surfaced event threads. Articles are evidence. Status explains narrative phase. Impact controls retention. Momentum controls ranking. Candidate detection controls LLM cost.


---

# Explanation of things i didn't understod
### Theme matching
**Themes**
Right now you do **not** really store article-level `themes`.

You store:
- `categories`
- `eventRegion`
- `entities`
- story-level `themes` on `StoryCluster`

So when I said “entities/themes recur,” for your current system I really meant:
- recurring `entities`
- recurring `categories`
- recurring `eventRegion`
- later, recurring article-level `themes` if you add them

For now, do not depend on themes for candidate detection unless you add a field like:
```prisma
ProcessedArticle {
  themes String[]
}
```

Examples of article themes could be:
- `sanctions`
- `ceasefire`
- `election`
- `military escalation`
- `trade dispute`
- `diplomatic talks`
- `civil unrest`
- `terror attack`
- `legal case`

But this is optional. Your current near-term version can use `entities + category + region + title/content similarity`.


### Entity normalization

**Entity Normalization**
You are right to worry. Entity normalization should not destructively replace the original entity list.

Store or compute two forms:
```js
originalEntities: ["President Putin", "U.S.", "Kremlin"]
normalizedEntities: ["vladimir putin", "united states", "kremlin"]
```

Or, if you do not want a schema change yet, normalize only inside the clustering function and keep DB values unchanged.

Important rule:
> Never strip entities from the article. Only create a normalized comparison key.

So if the article has only one entity, you still keep it. You just compare using its normalized version.

Example:
```js
function normalizeEntityForMatch(entity) {
  return entity
    .toLowerCase()
    .replace(/^president\s+/, "")
    .replace(/^prime minister\s+/, "")
    .replace(/\bu\.s\.\b/g, "united states")
    .trim();
}
```

But be conservative. Do not over-normalize.

Good normalization:
- trim whitespace
- lowercase for comparison
- remove punctuation differences
- map obvious aliases: `U.S.` → `United States`
- remove titles only when followed by a proper name: `President Putin` → `Putin`

Risky normalization:
- removing generic words everywhere
- shortening full names automatically
- fuzzy matching unrelated names
- assuming surnames are always unique

Best approach:
1. Keep original entities unchanged.
2. Add normalized comparison keys.
3. Use a small alias dictionary.
4. Log overlap decisions during clustering.
5. Only expand normalization rules when you see real misses.

So yes, entity normalization has edge cases. The safe version is not “clean and replace”; it is “preserve original, compare with normalized helper values.”