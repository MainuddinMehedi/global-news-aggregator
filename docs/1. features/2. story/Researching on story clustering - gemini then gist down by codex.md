# what are stories, what different types of stories are there and what are the lifecycle of those

> ⚠️ **Reference document only.** The synthesized takeaways from this conversation are in [story-research-keynotes-and-takeaways.md](story-research-keynotes-and-takeaways.md). This file is kept for traceability back to the raw Gemini conversation.

##### **Random jot downs** - not highly important notes but trying to think through

So, i get a type - quick come quickly goes types of stories. 
	Spot/Breaking news. 
Now,, **What are the types of breaking news i might want?**
	any short diplomatic concerns, 
	Sport hypes or historic events in sport. 
	Any breakout of medical facts/events/concerns
	geopolitical things
	....?

> I think eventually i would like to create a hype detector for this app. a ML system that detects which is in hype. 


There's a mention of something called SimHash. I guess it can be usefull for our particular use case where we try to find similar entities in the article to decide whether a article matches the other. evalute on this whether i can be useful in this or not!
**Addressed here** - [7. SimHash note](#7.%20SimHash%20note)

There's another mention - graph database, which i don't know/understand yet. so donno how it can be useful or not. but consider this knowing whether later or right now, in this project it serves a very good purpose. 
**Addressed here** - [8. Graph database note](#8.%20Graph%20database%20note)

---

# Reference
- Conversation link with gemini - https://gemini.google.com/share/f235f941c0fd


---
# Summarization by agent of the Gemini conversation. 

Follow-up implementation planning note:
- [Story clustering implementation plan - solving current problems](Story%20clustering%20implementation%20plan%20-%20solving%20current%20problems.md) - documents ranking alternatives, relevant top-30 LLM candidate selection, deferred `storyType`, conservative normalization, fuzzy matching options, and kept-for-later decisions.

## Compact takeaways

The strongest takeaway from this conversation is that "story" should not mean one universal thing. Different story types behave differently over time, so the system should not treat every cluster like short-lived breaking news.

### 1. Story types that matter for this product

**Spot / Breaking Story**
- A sudden event that spikes fast and decays fast.
- Examples: attack, resignation, disaster, launch, deal announcement, diplomatic statement, court verdict.
- Usual lifecycle: minutes/hours to 1-3 days.
- Product handling: surface quickly, rank by freshness/momentum, archive quickly when inactive.
- Risk: high duplication, because many sources rewrite the same wire story.

**Slow-Burn Strategic Story**
- A low-volume but high-importance event thread that unfolds through institutions, negotiations, deadlines, filings, sanctions, military positioning, or long diplomatic processes.
- Examples: border tensions, sanctions enforcement, nuclear talks, WTO disputes, arms procurement, cyber campaigns, tribunal/legal cases.
- Usual lifecycle: weeks to months, sometimes years.
- Product handling: do not require 3 articles in 48h only; use longer recurrence windows and timeline-style presentation.
- Risk: easy to accidentally create broad topic pages instead of event stories.

**Investigative / Scoop Fallout Story**
- A major investigative article or leak that triggers follow-up coverage.
- Examples: corruption expose, leaked documents, state abuse investigation, corporate/government scandal.
- Usual lifecycle: initial spike, then follow-up reactions for days/weeks.
- Product handling: track the original investigation plus reactions, denials, resignations, inquiries, legal actions.
- Risk: the first article may be single-source, so the system needs a candidate/verification phase before treating it like a public story.

**Evergreen / Context Story**
- Background, profile, explainer, or long-term phenomenon coverage.
- Examples: "why this conflict matters", leader profile, historical explainer, demographic/social trend.
- Usual lifecycle: long shelf life but low breaking velocity.
- Product handling: use as context blocks attached to active stories, not necessarily as active headline stories.
- Risk: can pollute the story feed if mixed with active event threads.

### 2. Slow-burn lifecycle pattern

Slow-burn stories usually move through these phases:

1. **Incubation**
   - The issue exists but is mostly invisible.
   - Signals appear in filings, specialist reports, niche sources, official schedules, or small statements.
   - For the system: probably keep as candidate/internal evidence, not surfaced story.

2. **Friction**
   - The issue becomes public through a trigger: formal talks, sanctions proposal, legal filing, military movement, official complaint, summit, or public accusation.
   - For the system: this is often where a story can be created if at least one more confirming signal appears.

3. **Stalemate / Escalation**
   - Longest phase. Activity is cyclical and milestone-based.
   - Coverage may be low, but each update can be important.
   - For the system: retention must be longer than breaking news; timeline and key developments matter more than article count alone.

4. **Inflection / Resolution**
   - A deadline, ruling, clash, treaty, collapse, withdrawal, or settlement forces a major change.
   - The slow-burn can temporarily become breaking news.
   - For the system: status may change from `SLOW_BURN` to `ESCALATING`, `DEVELOPING`, or `RESOLVING`.

5. **Aftermath**
   - The event stops producing frequent news, but consequences continue.
   - For the system: archive from the main feed but keep it queryable and attachable as context if the issue resurfaces.

### 3. Product design takeaway

The aggregator's value is not only grouping similar articles. Its real value is turning repeated reporting into structured knowledge:

- **Synthesis:** combine multiple reports into one readable state-of-story summary.
- **Timeline:** show how the event evolved.
- **Perspective split:** show how different regions/sources frame the same event.
- **Context buffer:** explain background for users entering late.
- **Fallout tracker:** for investigations or major announcements, track responses and consequences.

This means the story page should not be just a list of articles. It should gradually become a structured event object.

### 4. Architectural takeaway

The system should support multiple processing paths:

- **Hot path:** breaking stories, high velocity, short retention, homepage prominence.
- **Warm path:** investigative/fallout stories, medium retention, reaction tracking.
- **Structural path:** slow-burn stories, long retention, timeline/hub presentation.
- **Context path:** evergreen explainers/profiles used as supporting material.

This does not require building four separate infrastructures immediately. For now, it means the story model and lifecycle logic should recognize story type/status so all stories are not treated like breaking news.

### 5. Candidate detection implications

The current `3 articles in 48h` rule is suitable for Spot/Breaking stories, but weak for Slow-Burn and Investigative stories.

Better creation logic should allow:

- 3+ related articles in 48h -> possible breaking story.
- 2+ related articles over 7-14 days with recurring entities/region/category/event language -> possible slow-burn story.
- 1 high-significance article -> internal `CANDIDATE`, not automatically surfaced.
- Investigative article -> candidate story until follow-up/reaction confirms wider event significance.

The main question should be:

> Is this an event thread worth following, or only a single article / broad topic?

### 6. Lifecycle implications

Lifecycle should depend on story type, status, impact, and inactivity.

Important distinction:
- `status` describes narrative phase: `EMERGING`, `DEVELOPING`, `ESCALATING`, `SLOW_BURN`, `STABLE`, `RESOLVING`, `ARCHIVED`.
- `impact` controls retention strength: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `momentum` should control ranking/prominence, not archival.

This avoids the current problem where momentum decay can archive stories before impact-based retention has a chance to work.

### 7. SimHash note

SimHash may be useful, but mainly for near-duplicate detection, not full story understanding.

Good use cases:
- detect many rewrites of the same wire article.
- collapse duplicate or highly similar articles inside a breaking story.
- reduce repeated LLM input.
- support "this is the same immediate event" detection for high-velocity news.

Weak use cases:
- detecting slow-burn relations across different wording.
- understanding that sanctions, talks, and military movement are part of one strategic thread.
- distinguishing same-entity-but-different-event cases.

Conclusion: SimHash can be useful as a cheap duplicate/similarity signal, but it should not replace entity/event/region scoring or LLM story decisions.

### 8. Graph database note

A graph model could be useful later because stories are naturally relational:

- Article -> Entity
- Article -> Story
- Story -> Entity
- Story -> Region
- Story -> Event milestone
- Story -> Related story
- Entity -> Entity relationship

But this project probably does not need a separate graph database right now. PostgreSQL can support the next stage with relational tables, join tables, JSON fields, and later `pgvector` for similarity.

Useful graph-style thinking now:
- model relationships clearly.
- avoid treating story clustering as only one flat table.
- consider future links between related stories, predecessor stories, and aftermath stories.

Conclusion: graph thinking is valuable; adopting a graph database is a later-scale decision.

### 9. Practical direction for this feature

Near-term system direction:

1. Keep `StoryCluster` as the main event-thread object.
2. Add/clarify story `type` or make `status` expressive enough to separate breaking vs slow-burn vs resolving.
3. Remove archival authority from momentum.
4. Use impact/status/inactivity for retention.
5. Improve candidate detection beyond exact entity overlap.
6. Treat single strong articles as candidates, not public stories.
7. Add timeline/key-development thinking early, because slow-burn value depends on chronology.

Overall product principle:

> Stories are not just article clusters. They are evolving event threads with different temporal shapes.


---
