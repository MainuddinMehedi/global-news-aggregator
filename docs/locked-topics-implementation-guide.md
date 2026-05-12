# Locked Topics — Full Feature List & Implementation Guide

> **Purpose of this document:** Complete specification for implementing the Locked Topics feature in the Global News Aggregator. Written for use with an AI coding agent (Gemini CLI, Anthropic CLI, etc.). Every decision has been finalized. No ambiguity left intentionally.

---

## What Locked Topics Is

A manual, intentional tracking system. Unlike Stories (which are auto-assembled by AI from the ingestion pipeline), Locked Topics are created by you for a specific investigative purpose. You define what to track, why, and where to look. The system acts like an employed researcher — going out every 2 hours, checking all configured sources, and bringing back findings.

Topics stay alive until you explicitly turn them off (archived) or delete them. Raw findings are never auto-purged. Data is only deleted when you choose to delete the topic.

---

## Scope Boundaries (What Is NOT Included)

- No LinkedIn scraping (ToS violation)
- No paywalled content (Reuters, Bloomberg — headlines only via Google News)
- No real-time notifications (minimum latency is one workflow cycle = ~2 hours)
- No multi-user UI (schema supports future userId, but UI is single-user for now)
- No mobile push notifications (Discord and Telegram cover this via their own apps)
- No automatic finding purging or consolidation — findings live as long as the topic exists

---

## Part 1 — Complete Feature List

### Feature 1: Topic Creation (Multi-Step Modal)

A 4-step modal flow triggered by the "Lock New Topic" button on the `/locked-topics` page.

**Step 1 — Intent**

- Input: Display name (short label, e.g. "iran-israel", "google-jobs")
- Input: Context block — a free-text area where the user writes the full intention. Example: "I want to track whether Google is posting any new AI or ML engineering roles, specifically in their DeepMind or Search divisions."
- Validation: Both fields required before proceeding.

**Step 2 — Sources**

Three tiers of sources, all optional except Internal DB which is always on.

Tier 1 — System-native (pre-configured, guaranteed to work):

- Internal Article DB — always enabled, no toggle. Scans existing ProcessedArticles.
- Google News RSS — toggle. Uses `news.google.com/rss/search?q={refinedQuery}`. No API key needed.
- Brave Search API — toggle. Requires `BRAVE_API_KEY` in env. General web results.
- Reddit — toggle. Uses official Reddit JSON API (`reddit.com/search.json?q={query}`). No key needed for read-only.

Tier 2 — Pre-built scrapers (system has configured selectors for these):

- Bangladesh Government Jobs — scrapes bpsc.gov.bd, ppsc.gov.bd, and a configurable list of ministry job pages.
- GitHub — tracks releases and repo activity via GitHub REST API (`/repos/{owner}/{repo}/releases`). Sub-config: user enters `owner/repo`.
- YouTube Channel — tracks new videos via YouTube's public RSS feed (`youtube.com/feeds/videos.xml?channel_id={id}`). Sub-config: user enters channel URL or ID.
- Company Career Pages — pre-built scrapers for major companies (Google, Meta, etc.). Expandable list.

Tier 3 — User-defined (freeform, best-effort):

- Add any RSS feed URL — system validates it's a real RSS/Atom feed before saving.
- Add any webpage URL — system fetches the page on each scan, diffs the text content against the previous fetch, treats meaningful changes as new findings.
- Custom search query override — user writes a raw search string that replaces the AI-generated query when hitting Google News and Brave.

**Step 3 — AI Review**

System calls Gemini Flash (via frontend API route — key never exposed to client) with the display name and context block.

AI returns:

- `aiRefinedQuery` — an optimized search string the scanner will actually use.
- `aiQuerySummary` — a plain English paragraph of what the AI understood. Example: "Tracking new engineering job postings from Google's AI divisions, specifically DeepMind and Search. Monitoring for ML, AI, and research roles posted to Google's careers site and indexed by major search engines."
- `suggestedSources` — a JSON array of source suggestions based on context. Example: for a BD government jobs topic, AI suggests specific ministry URLs. These appear as checkboxes the user can accept or reject.

Displayed in Step 3:

- "Here's what I understood:" → full aiQuerySummary
- "I'll be searching for:" → aiRefinedQuery (editable text field — user can tweak before activating)
- "Suggested additional sources:" → list of AI suggestions with accept/reject per item

**Step 4 — Activation**

- "Activate Topic" button calls `POST /api/locked-topics` — creates the LockedTopic record in DB.
- Modal closes. Card appears immediately on the list page with an "Initial scan running..." state.
- Client immediately calls `POST /api/locked-topics/[id]/scan` — triggers internal DB scan synchronously.
- External scans are queued — they run on the next `topics.yml` workflow trigger (within 2 hours).

---

### Feature 2: Locked Topics List Page (`/locked-topics`)

The main page, already wired in `NavLinks.tsx`. Currently a stub. Replace with full implementation.

**This is a React Server Component.** Data is fetched directly via `getLockedTopics()` — no client-side fetch on page load.

**Page header:**

- Title: "Locked Topics"
- Subtitle: "Pin specific themes to ensure they are persistently tracked."
- "Lock New Topic" button (primary, top right) — opens the multi-step modal.

**Topic cards grid (2 columns on desktop, 1 on mobile):**

Each card shows:

- Lock icon (styled, consistent with your existing HugeIcons usage)
- Display name (bold)
- Match count + last matched timestamp ("45 Matches · Last: 2h ago")
- Unread badge — red circle with count of findings newer than `lastViewedAt`. Appears on bell icon.
- Active monitoring toggle (right side) — green = active, grey = inactive/archived. Toggling calls `PATCH /api/locked-topics/[id]` via client action.
- Bell icon — clicking opens the Notification Settings modal (see Feature 4).
- `aiQuerySummary` — shown truncated to 2 lines below the match count.
- "LATEST FINDINGS" section — shows the 3 most recent `TopicFinding` titles as bullet points. If no findings yet: "No findings yet." If initial scan still running: skeleton lines (managed by a small Client Component that polls `GET /api/locked-topics/[id]/status` until `lastScannedAt` is set).

**Card states:**

- Normal (has findings)
- Empty (topic active, no findings yet)
- Scanning (just created, `lastScannedAt` is null — client polls status endpoint every 3 seconds until set)
- Archived (isActive = false) — card visually muted, toggle is grey, no new findings badge

**Empty page state:**

- Shown when user has no topics at all.
- Centered illustration + "No locked topics yet" + "Lock New Topic" button.

---

### Feature 3: Topic Detail Page (`/locked-topics/[id]`)

A dedicated page (not a modal, not a slide-over). All secondary interactions on this page open as modals on top of it.

**This is a hybrid Server + Client page.** The server component fetches topic metadata and the first 20 findings directly from Prisma (reading filters from `searchParams`). The `FindingsList` component is a Client leaf that handles infinite scroll pagination via API route, and updates the URL to trigger filter changes.

**Header section (Server):**

- Display name (large heading)
- Match count + last scanned timestamp
- Active toggle (client action — calls PATCH)
- Edit button → opens Edit Topic modal
- Delete button → opens Delete confirmation modal

**AI Understanding section (Server):**

- Label: "What the system is tracking"
- Full `aiQuerySummary` text (not truncated)
- Current `aiRefinedQuery` shown as a code-like block (monospace, subtle border)

**Context section (Server + Client toggle):**

- Label: "Your context"
- The original `userContext` text
- Truncated to 3 lines with a "Show more" / "Show less" client toggle
- Edit button — inline, opens Edit Topic modal focused on the context field

**Sources section (Server):**

- List of all active sources for this topic
- Each source shows: type badge (RSS / SCRAPE / GOOGLE / BRAVE / REDDIT / INTERNAL), source name/URL, status (active/error)
- "Add source" button → inline form to add Tier 3 source

**Findings section (Hybrid):**

- Server fetches initial 20 findings (respecting URL `searchParams`) and passes as props to `FindingsList`
- `FindingsList` is a Client Component that:
  - Renders the initial findings immediately (no flicker, no spinner on first paint)
  - Handles "Load More" (infinite scroll) via `GET /api/locked-topics/[id]/findings?cursor=last_id`
  - Handles filter changes by updating the URL (`?sourceType=GOOGLE`), letting Next.js stream the new UI state down
  - Uses cursor-based pagination (not offset) to prevent duplicates on live feeds
- Filter bar: ALL / ARTICLE / GOOGLE / BRAVE / RSS / SCRAPE / REDDIT
- Sort: newest first (default), oldest first, highest relevance score
- Each finding shows:
  - Title (linked to sourceUrl, opens in new tab)
  - Source name + type badge
  - Relevance score dot (green ≥ 0.8, amber ≥ 0.5, grey < 0.5)
  - `foundAt` timestamp (relative: "3h ago")
  - If `rawArticleId` not null: "Internal article" badge — clicking opens the existing ArticleDetailsModal

**Generate Summary button (Client):**

- User presses it → calls `POST /api/locked-topics/[id]/summary`
- API calls Groq with all current findings → returns 2-3 paragraph summary
- Displayed in a modal with a copy button
- Logs token usage to `AiUsage` table

---

### Feature 4: Notification Settings Modal

Opened by clicking the bell icon on any topic card or from the detail page. Client Component modal.

**Content:**

- Topic name as modal title
- "Last notified: [timestamp or Never]"
- Mode selector (two options, radio-style):
  - DIGEST — sends once daily at 8am UTC. Only fires if new findings exist since last digest.
  - ALERT — fires immediately on new finding, but only if relevance score meets threshold.
- If ALERT selected: relevance threshold slider (0.5 to 1.0, default 0.8). Label: "Only notify me if the finding is at least [X]% relevant."
- Channel section:
  - Discord toggle — on/off. Shows "Connected" if `DISCORD_WEBHOOK_URL` is in env. Availability checked via `GET /api/locked-topics/channels` (server-side env read).
  - Telegram toggle — on/off. Shows "Connected" if `TELEGRAM_BOT_TOKEN` is in env.
- Save button — calls `PATCH /api/locked-topics/[id]` to update notify fields.
- "Turn off all notifications for this topic" link (sets notifyEnabled = false without changing other settings).

---

### Feature 5: Edit Topic Modal

Opened from the detail page Edit button. Client Component modal.

**Editable fields:**

- Display name
- Context block (full text area)
- "Re-run AI analysis" button — calls `POST /api/locked-topics/ai-refine` with updated context, returns new aiRefinedQuery and aiQuerySummary. User reviews before saving.
- aiRefinedQuery (editable text field)

**On save:** calls `PATCH /api/locked-topics/[id]`, then server-side `updateTag` clears cache.

**What is NOT editable here:**

- Sources (managed separately in the Sources section of the detail page)
- Historical findings (immutable)

---

### Feature 6: Delete Topic Modal

Opened from the detail page Delete button. Client Component modal.

**Two options presented:**

1. "Archive summary first, then delete" — calls `POST /api/locked-topics/[id]/summary` to generate final summary, shows it in modal with copy button, then calls `DELETE /api/locked-topics/[id]` (cascade deletes all findings via Prisma relation).
2. "Delete everything" — calls `DELETE /api/locked-topics/[id]` immediately. Requires typing the topic display name to confirm.

---

### Feature 7: The Scanning Workflow (`topics.yml`)

A new GitHub Actions workflow that runs every 2 hours, independent of the existing `ingest.yml` and `backlog.yml`.

**Trigger:** Schedule (`0 */2 * * *`) for scanning, (`0 8 * * *`) for DIGEST notifications. Plus manual `workflow_dispatch`.

**For each active LockedTopic (isActive = true):**

1. Load topic with its sources config.
2. Run Internal DB scan — query `ProcessedArticle` WHERE title or contentSnippet matches key terms from `aiRefinedQuery`. Use `mode: insensitive`. Link matches via `rawArticleId`.
3. Run Google News RSS — fetch `https://news.google.com/rss/search?q={encodeURIComponent(aiRefinedQuery)}&hl=en`. Parse RSS. Extract title + link.
4. Run Brave Search — if `BRAVE_API_KEY` set and topic has Brave enabled. `GET https://api.search.brave.com/res/v1/web/search?q={query}`. Extract title + url.
5. Run Reddit — if enabled. `GET https://www.reddit.com/search.json?q={query}&sort=new`. Extract post titles + links.
6. Run Tier 2 scrapers — if configured. Each scraper is a separate module in `ingestion-service/topics/scrapers/`. Called conditionally based on topic's sources JSON.
7. Run Tier 3 RSS feeds — fetch and parse each user-added RSS URL. Same approach as main RSS ingestion.
8. Run Tier 3 webpage diffs — fetch each user-added URL. Compare text content against `lastFetchedContent` stored in the source config. If diff > threshold (200+ characters changed): treat changed section as finding.
9. For each raw result: check if `sourceUrl` already exists in `TopicFinding` for this topic. If yes: skip (dedup). If no: proceed.
10. Score relevance — batch all new finding titles + `aiRefinedQuery` into a single Groq call. Returns array of scores 0.0-1.0. **Log token usage to `AiUsage` table.**
11. Save new `TopicFinding` rows.
12. Update `LockedTopic`: increment `matchCount`, update `lastMatchedAt`, update `lastScannedAt`.
13. Check notifications — if `notifyEnabled` is true: run notification logic.
14. Call revalidation endpoint for each scanned topic to clear Next.js cache.

**Notification logic:**

- DIGEST mode: mark findings as pending. Daily digest job (8am UTC schedule) collects all pending findings per topic and sends one message per topic.
- ALERT mode: for each new finding where relevance score ≥ `notifyThreshold`: send notification immediately.

**Notification format (Discord — ALERT):**

```
🔒 **[Topic Display Name]** — New Finding
📌 [Finding Title]
🔗 [Source URL]
📊 Relevance: 87%
⏱ Found: just now
```

**Notification format (Discord — DIGEST):**

```
🔒 **[Topic Display Name]** — Daily Digest
3 new findings today:
• [Title 1] — [Source] — [URL]
• [Title 2] — [Source] — [URL]
• [Title 3] — [Source] — [URL]
Total matches: 48
```

---

### Feature 8: AI Integration Points

**Point 1 — Topic creation / edit AI refinement (gpt oss 20b or Gemini 3.1 Flash, once per topic)**

- Trigger: Step 3 of creation modal, or "Re-run AI analysis" in Edit modal
- Called from: `POST /api/locked-topics/ai-refine` (server-side — API key never exposed to client)
- Provider: groq(`gpt oss 20b`) or fallback to Google Gemini Flash (`gemini-3.1-flash` via Google AI Studio free tier)
- Input: displayName + userContext
- Output: aiRefinedQuery, aiQuerySummary, suggestedSources[]
- AiUsage logging: NOT required (one-time call, negligible cost)

**Point 2 — Relevance scoring (Groq, batched per workflow run)**

- Trigger: After deduplication in the scanning workflow, before saving each batch of new findings
- Called from: `ingestion-service/topics/scorer.js`
- Provider: Groq (`AI_PRIMARY_MODEL` — Llama 4 Scout), using existing `rateLimiter.js`
- Input: array of finding titles + aiRefinedQuery
- Output: array of scores 0.0-1.0 (same order as input)
- Prompt: "Given this search topic: '[aiRefinedQuery]', rate how relevant each finding is on a scale of 0.0 to 1.0. Return only a valid JSON array of numbers in the same order as the input. Findings: [array of titles]"
- AiUsage logging: **REQUIRED** — runs on schedule, compounds over time

**Point 3 — On-demand summary (Groq, user-triggered)**

- Trigger: User clicks "Generate Summary" on detail page
- Called from: `POST /api/locked-topics/[id]/summary`
- Provider: Groq (`AI_PRIMARY_MODEL`)
- Input: all TopicFinding titles + sources for this topic
- Output: 2-3 paragraph narrative summary (not persisted — displayed in modal, user copies)
- AiUsage logging: **REQUIRED** — user-visible action, useful to audit

---

## Part 2 — Data Model

### New Prisma Models

Add these to `prisma/schema.prisma`. Do not modify existing models.

```prisma
model LockedTopic {
  id                  String         @id @default(uuid())
  userId              String?        // nullable — single user for now, ready for multi-user
  displayName         String
  userContext         String         @db.Text
  aiRefinedQuery      String         @db.Text
  aiQuerySummary      String         @db.Text
  sources             Json           // SourceConfig[]
  searchBeyondSources Boolean        @default(true)
  isActive            Boolean        @default(true)
  notifyEnabled       Boolean        @default(false)
  notifyMode          NotifyMode     @default(DIGEST)
  notifyThreshold     Float          @default(0.8)
  notifyChannels      Json           // { discord: bool, telegram: bool }
  matchCount          Int            @default(0)
  lastMatchedAt       DateTime?
  lastViewedAt        DateTime?
  lastScannedAt       DateTime?      // null = initial scan not yet run (scanning state)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  findings            TopicFinding[]
}

model TopicFinding {
  id              String        @id @default(uuid())
  topicId         String
  topic           LockedTopic   @relation(fields: [topicId], references: [id], onDelete: Cascade)
  title           String
  summary         String?
  sourceType      FindingSource
  sourceUrl       String
  sourceName      String
  rawArticleId    String?       // nullable — links to ProcessedArticle if internal
  relevanceScore  Float?
  isRead          Boolean       @default(false)
  foundAt         DateTime      @default(now())
  metadata        Json?         // { location, salary, company, etc. }

  @@unique([topicId, sourceUrl])  // deduplication constraint
  @@index([topicId, foundAt])
  @@index([topicId, relevanceScore])
}

enum NotifyMode {
  DIGEST
  ALERT
}

enum FindingSource {
  ARTICLE   // from internal ProcessedArticle DB
  GOOGLE    // Google News RSS
  BRAVE     // Brave Search API
  REDDIT    // Reddit search
  RSS       // user-added RSS feed
  SCRAPE    // pre-built Tier 2 scraper
  WEBPAGE   // user-added webpage diff
}
```

### SourceConfig JSON Shape

Stored in `LockedTopic.sources` as a JSON array. TypeScript type for reference:

```typescript
interface SourceConfig {
  id: string;
  type:
    | "internal_db"
    | "google_news"
    | "brave"
    | "reddit"
    | "rss"
    | "scrape"
    | "webpage";
  label: string; // "BD PSC", "Google Careers RSS"
  enabled: boolean;
  url?: string; // for rss, scrape, webpage types
  scraperKey?: string; // for scrape type: key into pre-built scraper registry
  subConfig?: Record<string, string>; // e.g. { channelId: "UCxxx" } for YouTube
  lastFetchedContent?: string; // for webpage diff: last known content hash
  lastFetchedAt?: string; // ISO timestamp
}
```

### Migration

```bash
npx prisma migrate dev --name add_locked_topics
```

---

## Part 3 — Rendering Architecture

This is the most critical section for the coding agent. Follow this table exactly.

| Feature                  | How Data Is Fetched                                                                  | Why                                               |
| ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Topic list page          | **Direct Prisma in Server Component** (`getLockedTopics()`)                          | SSR, no flicker, no waterfall                     |
| Topic detail metadata    | **Direct Prisma in Server Component** (`getLockedTopicById()`)                       | Critical for initial render                       |
| Findings (initial 20)    | **Direct Prisma in Server Component**, passed as props to FindingsList               | No loading spinner on first paint                 |
| Findings (pagination)    | **API route** `GET /api/locked-topics/[id]/findings?cursor=id` from Client Component | Dynamic interaction, cursor-based infinite scroll |
| Findings (filter change) | **URL Search Params** (`?sourceType=X`)                                              | URL-driven, server re-renders initial findings    |
| Scanning status poll     | **API route** `GET /api/locked-topics/[id]/status` from small Client Component       | Only active when `lastScannedAt` is null          |
| Toggle isActive          | **API route** `PATCH /api/locked-topics/[id]` from Client Component                  | Mutation                                          |
| Create topic             | **API route** `POST /api/locked-topics` from modal Client Component                  | Mutation                                          |
| AI refinement            | **API route** `POST /api/locked-topics/ai-refine` from modal Client Component        | Calls Gemini server-side, key not exposed         |
| Trigger initial scan     | **API route** `POST /api/locked-topics/[id]/scan` from modal Client Component        | Mutation                                          |
| Edit topic               | **API route** `PATCH /api/locked-topics/[id]` from modal Client Component            | Mutation                                          |
| Delete topic             | **API route** `DELETE /api/locked-topics/[id]` from modal Client Component           | Mutation                                          |
| Generate summary         | **API route** `POST /api/locked-topics/[id]/summary` from Client Component           | Calls Groq server-side                            |
| Notification settings    | **API route** `PATCH /api/locked-topics/[id]` from modal Client Component            | Mutation                                          |
| Channel availability     | **API route** `GET /api/locked-topics/channels` from modal Client Component          | Reads env vars server-side                        |

---

## Part 4 — File Structure

All new files to create. Existing files noted where modification is needed.

```
prisma/
  schema.prisma                          MODIFY — add new models above

frontend/
  app/
    locked-topics/
      page.tsx                           REPLACE stub — Server Component, calls getLockedTopics()
      [id]/
        page.tsx                         CREATE — Server Component, calls getLockedTopicById()
                                                  passes initial findings as props to FindingsList
    api/
      locked-topics/
        route.ts                         CREATE — POST (create topic)
        ai-refine/
          route.ts                       CREATE — POST (calls Gemini, returns AI analysis)
        channels/
          route.ts                       CREATE — GET (returns which notification channels
                                                  are configured by reading env vars server-side)
        [id]/
          route.ts                       CREATE — GET (full detail + updates lastViewedAt),
                                                  PATCH (partial update), DELETE
          scan/
            route.ts                     CREATE — POST (trigger internal DB scan immediately)
          findings/
            route.ts                     CREATE — GET (cursor paginated — used by client for infinite scroll)
          status/
            route.ts                     CREATE — GET (returns lastScannedAt — for polling)
          summary/
            route.ts                     CREATE — POST (calls Groq, returns summary, logs AiUsage)

  components/
    locked-topics/
      LockedTopicCard.tsx                CREATE — Server Component (static card data)
      LockedTopicCardClient.tsx          CREATE — Client Component (toggle, bell, scanning poll)
      LockedTopicGrid.tsx                CREATE — Server Component grid wrapper + empty state
      CreateTopicModal/
        index.tsx                        CREATE — Client Component modal shell + step router
        Step1Intent.tsx                  CREATE — Client Component
        Step2Sources.tsx                 CREATE — Client Component
        Step3AIReview.tsx                CREATE — Client Component (calls ai-refine API)
        Step4Confirm.tsx                 CREATE — Client Component (calls create + scan APIs)
      NotificationModal.tsx              CREATE — Client Component
      EditTopicModal.tsx                 CREATE — Client Component (calls ai-refine + PATCH)
      DeleteTopicModal.tsx               CREATE — Client Component
      FindingsList.tsx                   CREATE — Client Component (infinite scroll + URL filter state)
      FindingRow.tsx                     CREATE — Client Component (single finding item)
      TopicSources.tsx                   CREATE — Client Component (add/remove sources)
      GenerateSummaryModal.tsx           CREATE — Client Component

  queries/
    lockedTopics.ts                      CREATE — getLockedTopics(), getLockedTopicById()
                                                  Both use 'use cache' + cacheTag + cacheLife
    topicFindings.ts                     CREATE — getInitialFindings(id) for Server Component

  types/
    lockedTopic.ts                       CREATE — LockedTopic, TopicFinding, SourceConfig interfaces

ingestion-service/
  topics/
    scanner.js                           CREATE — orchestrates all sources for one topic
    sources/
      internalDb.js                      CREATE — ProcessedArticle keyword scanner
      googleNews.js                      CREATE — Google News RSS fetcher
      brave.js                           CREATE — Brave Search API caller
      reddit.js                          CREATE — Reddit JSON API caller
      rssSource.js                       CREATE — generic RSS feed fetcher
      webpageDiff.js                     CREATE — webpage fetch + diff logic
    scrapers/
      bdGovJobs.js                       CREATE — BD government job sites scraper
      githubReleases.js                  CREATE — GitHub releases API
      youtubeFeed.js                     CREATE — YouTube channel RSS
    scorer.js                            CREATE — Groq relevance scoring (batched)
                                                  Uses existing rateLimiter.js
                                                  Logs to AiUsage table
    notifier.js                          CREATE — Discord + Telegram notification sender
  processTopics.js                       CREATE — entry point (like processBacklog.js)
                                                  Calls revalidation endpoint after each topic

.github/
  workflows/
    topics.yml                           CREATE — new workflow, runs every 2 hours
```

---

## Part 5 — Caching Strategy

Follow the exact same pattern as `getArticles()` and `getCategories()`. This project uses Next.js 16 with `cacheComponents: true` — nothing is cached unless explicitly opted in with `'use cache'`.

```typescript
// frontend/queries/lockedTopics.ts

export async function getLockedTopics() {
  "use cache";
  cacheTag("locked-topics");
  cacheLife("minutes"); // revalidates every 1 min, expires 1 hour
  // direct Prisma query here
}

export async function getLockedTopicById(id: string) {
  "use cache";
  cacheTag(`locked-topic-${id}`);
  cacheTag("locked-topics"); // also invalidated by global tag
  cacheLife("minutes");
  // direct Prisma query here
}
```

**Cache invalidation — three triggers:**

**1. After scanning workflow runs** — `processTopics.js` calls the existing revalidation endpoint after each topic is processed:

```javascript
// After each topic is scanned and findings saved:
await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/revalidate?tag=locked-topics&secret=${process.env.REVALIDATE_SECRET}`,
);
await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/revalidate?tag=locked-topic-${topic.id}&secret=${process.env.REVALIDATE_SECRET}`,
);
```

**2. After any mutation API route** — inside each PATCH, DELETE, POST route handler after the DB write:

```typescript
import { updateTag } from "next/cache";
// After write:
updateTag("locked-topics");
updateTag(`locked-topic-${id}`);
```

**3. After initial scan completes** — `POST /api/locked-topics/[id]/scan` calls `updateTag` after findings are saved.

The `/api/revalidate` endpoint already exists in your project. Reuse it. Do not create a new one.

---

## Part 6 — API Routes Specification

### `POST /api/locked-topics`

Creates a new LockedTopic. After creating: call `updateTag('locked-topics')`.

Request body:

```typescript
{
  displayName: string
  userContext: string
  aiRefinedQuery: string
  aiQuerySummary: string
  sources: SourceConfig[]
  searchBeyondSources: boolean
  notifyEnabled: boolean
  notifyMode: 'DIGEST' | 'ALERT'
  notifyThreshold: number
  notifyChannels: { discord: boolean, telegram: boolean }
}
```

### `POST /api/locked-topics/ai-refine`

Calls Gemini Flash server-side. `GEMINI_API_KEY` never exposed to client.

Request body: `{ displayName: string, userContext: string }`

Response:

```typescript
{
  aiRefinedQuery: string;
  aiQuerySummary: string;
  suggestedSources: Array<{ label: string; url: string; type: string }>;
}
```

### `GET /api/locked-topics/channels`

Reads env vars server-side. Returns which notification channels are configured.
Response: `{ discord: boolean, telegram: boolean }`

### `GET /api/locked-topics/[id]`

Returns full topic detail. Also updates `lastViewedAt` to now (clears unread badge).
Note: This GET exists for client-side use after mutations. The page itself fetches via `getLockedTopicById()` directly.

### `PATCH /api/locked-topics/[id]`

Partial update. Accepts any subset of LockedTopic fields.
After updating: call `updateTag('locked-topics')` and `updateTag('locked-topic-${id}')`.

### `DELETE /api/locked-topics/[id]`

Deletes topic and all findings (Prisma cascade via the relation).
Query param: `?generateSummary=true` — if present, generate and return summary text before deleting.
After deleting: call `updateTag('locked-topics')`.

### `POST /api/locked-topics/[id]/scan`

Triggers the internal DB scan synchronously. Called immediately after topic creation.
Queries `ProcessedArticle` WHERE title or contentSnippet contains terms from `aiRefinedQuery`.
Saves matching findings as `TopicFinding` rows with `sourceType: 'ARTICLE'`.
Updates `lastScannedAt`, `matchCount`.
After completing: call `updateTag('locked-topics')` and `updateTag('locked-topic-${id}')`.
Returns: `{ newFindings: number }`

### `GET /api/locked-topics/[id]/findings`

Cursor-paginated findings. Used by `FindingsList` Client Component only for infinite scroll "Load More".
Query params: `?cursor=finding_id&sourceType=ALL&sort=newest`
Uses Prisma `cursor: { id }` + `skip: 1` + "take + 1 trick".
Response: `{ findings: TopicFinding[], nextCursor: string | null }`

### `GET /api/locked-topics/[id]/status`

Lightweight polling endpoint. Only called when `lastScannedAt` is null.
Response: `{ lastScannedAt: string | null, matchCount: number }`
Client Component polls every 3 seconds until `lastScannedAt` is set, then stops polling.

### `POST /api/locked-topics/[id]/summary`

Calls Groq with all findings for this topic.
Logs token usage to `AiUsage` table.
Response: `{ summary: string }` — not persisted to DB.

---

## Part 7 — GitHub Actions Workflow

**File:** `.github/workflows/topics.yml`

```yaml
name: Locked Topics Scanner

on:
  schedule:
    - cron: "0 */2 * * *" # every 2 hours — scan all active topics
    - cron: "0 8 * * *" # daily at 8am UTC — send DIGEST notifications
  workflow_dispatch:
    inputs:
      topic_id:
        description: "Scan a specific topic ID only (optional)"
        required: false

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install Dependencies
        run: npm install

      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Run Topic Scanner
        run: |
          if [ -n "${{ github.event.inputs.topic_id }}" ]; then
            node ingestion-service/processTopics.js --topic-id=${{ github.event.inputs.topic_id }}
          elif [ "${{ github.event.schedule }}" == "0 8 * * *" ]; then
            node ingestion-service/processTopics.js --digest-only
          else
            node ingestion-service/processTopics.js
          fi
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          REVALIDATE_SECRET: ${{ secrets.REVALIDATE_SECRET }}
          AI_PRIMARY_API_KEY: ${{ secrets.AI_PRIMARY_API_KEY }}
          AI_PRIMARY_MODEL: ${{ secrets.AI_PRIMARY_MODEL }}
          AI_PRIMARY_BASE_URL: ${{ secrets.AI_PRIMARY_BASE_URL }}
          AI_TPM_LIMIT: ${{ secrets.AI_TPM_LIMIT }}
          AI_RPM_LIMIT: ${{ secrets.AI_RPM_LIMIT }}
          BRAVE_API_KEY: ${{ secrets.BRAVE_API_KEY }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
```

**New GitHub secrets to add:**

- `BRAVE_API_KEY`
- `DISCORD_WEBHOOK_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NEXT_PUBLIC_API_URL` — your deployed frontend URL (needed for revalidation calls from workflow)
- `REVALIDATE_SECRET` — already in your frontend env, add here too

---

## Part 8 — Implementation Order

Build in this exact order. Each phase is independently testable before moving to the next.

### Phase 1 — Data Foundation

1. Add new models to `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add_locked_topics`
3. Create `frontend/types/lockedTopic.ts` — all interfaces
4. Create `frontend/queries/lockedTopics.ts` — `getLockedTopics()`, `getLockedTopicById()`
5. Create `frontend/queries/topicFindings.ts` — `getInitialFindings(id)`
6. Create all API routes as stubs (return `{ ok: true }` or empty arrays)

**Test:** Run `npx prisma studio`. Confirm new tables exist. Hit `/api/locked-topics` stub — no errors.

### Phase 2 — List Page + Card UI

1. Build `LockedTopicCard.tsx` (Server Component — static display data)
2. Build `LockedTopicCardClient.tsx` (Client Component — toggle, bell, scanning poll)
3. Build `LockedTopicGrid.tsx` — grid layout + empty state
4. Replace `frontend/app/locked-topics/page.tsx` — call `getLockedTopics()` directly, no API route
5. Wire real DB query into `getLockedTopics()`
6. Wire `PATCH /api/locked-topics/[id]` for the active toggle

**Test:** Page renders with server-side data. Manually insert a row via Prisma Studio. Card appears on reload. Toggle updates DB.

### Phase 3 — Creation Modal

1. Build modal shell + step router (`CreateTopicModal/index.tsx`)
2. Build Step 1 — Intent form
3. Build Step 2 — Sources selector (all three tiers)
4. Wire `POST /api/locked-topics/ai-refine` to call Gemini Flash server-side
5. Build Step 3 — AI Review (calls ai-refine, shows results, allows edit of aiRefinedQuery)
6. Build Step 4 — Activation (calls `POST /api/locked-topics`, then `POST /api/locked-topics/[id]/scan`)
7. Wire "Lock New Topic" button on list page to open modal
8. Wire scanning poll in `LockedTopicCardClient.tsx`

**Test:** Full creation flow end-to-end. Topic appears in list. Scanning state shows then resolves. Internal DB findings appear on card.

### Phase 4 — Detail Page

1. Create `frontend/app/locked-topics/[id]/page.tsx` — Server Component
2. Call `getLockedTopicById()` and `getInitialFindings()` directly — pass as props
3. Wire `GET /api/locked-topics/[id]` to update `lastViewedAt` on page load (call from a useEffect in a Client Component wrapper on first mount)
4. Build all Server-rendered sections: header, AI Understanding, Context (with client toggle), Sources
5. Build `FindingsList.tsx` — accepts initial findings as props, handles infinite scroll pagination via API, and updates URL for filters
6. Build `FindingRow.tsx`
7. Wire `GET /api/locked-topics/[id]/findings` for cursor-based client-side pagination, and `useSearchParams` / `useRouter` for filter updates
8. Build `GenerateSummaryModal.tsx` — wire `POST /api/locked-topics/[id]/summary`

**Test:** Click a topic card → detail page renders immediately with content. Cursor pagination works. Filter changes update the URL and stream new data. Generate summary returns AI text in modal.

### Phase 5 — Edit + Delete + Notification Modals

1. Build `EditTopicModal.tsx` — including re-run AI analysis flow
2. Build `DeleteTopicModal.tsx` — both deletion paths (with summary / without)
3. Build `NotificationModal.tsx` — mode selector, threshold slider, channel toggles
4. Wire `GET /api/locked-topics/channels` for channel availability check
5. Wire all three modals into the detail page

**Test:** Edit a topic name. Re-run AI analysis — see updated summary. Save. Delete with summary generation. Configure ALERT mode with custom threshold.

### Phase 6 — Scanning Workflow

1. Build `ingestion-service/topics/sources/internalDb.js`
2. Build `ingestion-service/topics/sources/googleNews.js`
3. Build `ingestion-service/topics/sources/brave.js`
4. Build `ingestion-service/topics/sources/reddit.js`
5. Build `ingestion-service/topics/sources/rssSource.js`
6. Build `ingestion-service/topics/sources/webpageDiff.js`
7. Build Tier 2 scrapers: `bdGovJobs.js`, `githubReleases.js`, `youtubeFeed.js`
8. Build `ingestion-service/topics/scorer.js` — uses existing `rateLimiter.js`, logs to `AiUsage`
9. Build `ingestion-service/topics/notifier.js` — Discord + Telegram
10. Build `ingestion-service/topics/scanner.js` — orchestrates all sources for one topic
11. Build `ingestion-service/processTopics.js` — loads all active topics, runs scanner for each, calls revalidation endpoint after each topic
12. Create `.github/workflows/topics.yml`
13. Add new secrets to GitHub repository settings

**Test:** Run `node ingestion-service/processTopics.js` locally with a test topic. Verify findings appear in DB. Check `AiUsage` table for relevance scoring log. Verify Discord webhook fires. Verify frontend updates after revalidation call.

### Phase 7 — Polish + Integration

1. Make Locked Topics nav badge dynamic:
   - Create a new Zustand slice `TopicSlice` in `frontend/store/index.ts` with `unreadTopicsCount` state.
   - Create a `<TopicCountFetcher>` Client Component (wrapped in `<Suspense>`) in the `layout.tsx` static shell that fetches the sum of unread counts and updates the Zustand store.
   - Read this Zustand store inside `NavLinks.tsx` to render the badge, keeping the layout static.
2. Loading states on all modal async operations (spinner on AI refinement call, on save buttons).
3. Optimistic UI on the active toggle — update visual immediately, revert if PATCH fails.
4. Error handling — use Sonner toasts (already installed) on any API failure.
5. `?topic=` query param — same pattern as `?article=` in the feed. Clicking a card pushes `?topic={id}` to URL and navigates to detail page.

---

## Part 9 — Key Technical Notes for the Coding Agent

**Server-first architecture — the most important rule:**
The list page (`/locked-topics/page.tsx`) and detail page (`/locked-topics/[id]/page.tsx`) are React Server Components. They call query functions directly from Prisma. There is no `useEffect`, no `fetch` on the client for the initial page data. API routes exist only for mutations and dynamic client interactions (pagination, filtering, polling). Do not add `GET /api/locked-topics` as the primary data source for the list page. Do not add `GET /api/locked-topics/[id]` as the primary data source for the detail page.

**Caching:**
Use `'use cache'` + `cacheTag` + `cacheLife('minutes')` on `getLockedTopics()` and `getLockedTopicById()`. This is identical to how `getArticles()` works in this project. After every mutation route handler (PATCH, DELETE, POST scan), call `updateTag('locked-topics')` and `updateTag('locked-topic-${id}')`. The workflow calls the revalidation endpoint after each scan.

**Prisma client:**
Use `frontend/lib/prisma.ts` for all frontend API routes and query functions. Use `ingestion-service/db/client.js` for all workflow scripts. Do not create new Prisma client instances.

**Rate limiting in scorer.js:**
Import `waitForCapacity` and `recordUsage` from `ingestion-service/ai/rateLimiter.js`. Call `waitForCapacity(estimatedTokens)` before the Groq batch scoring call. Call `recordUsage(actualTokens)` after. Exact same pattern as `ingestion-service/ai/client.js`.

**AiUsage logging:**
The `AiUsage` model already exists in the schema. Log relevance scoring calls and on-demand summary calls. Do NOT log topic creation AI refinement calls (one-time, negligible). Use the same logging pattern as `processor.js`:

```javascript
await prisma.aiUsage.create({
  data: {
    date: new Date().toISOString().split("T")[0],
    provider: "groq",
    model: process.env.AI_PRIMARY_MODEL,
    tokensUsed: actualTokens,
    estimatedCost: (actualTokens / 1000) * 0.0006,
    success: true,
  },
});
```

**Gemini Flash integration:**
Google AI Studio provides an OpenAI-compatible endpoint. Use it in `POST /api/locked-topics/ai-refine`:

```javascript
const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  },
);
```

Read `process.env.GEMINI_API_KEY` server-side only. Never reference it in any Client Component or expose it to the browser.

**Source deduplication:**
The `@@unique([topicId, sourceUrl])` constraint on `TopicFinding` is the DB-level safety net. In the scanner, always check existence before insert — do not rely solely on the constraint to catch duplicates:

```javascript
const exists = await prisma.topicFinding.findUnique({
  where: { topicId_sourceUrl: { topicId, sourceUrl } }
})
if (exists) continue
```

**Existing `UserTopic` model:**
Leave it completely untouched. It is a different concept (story-to-user matching for the news feed). `LockedTopic` has no relation to it.

**Component naming:**
Follow existing codebase conventions exactly. `'use client'` at top of all Client Components. Server Components have no directive. API routes use `NextRequest`/`NextResponse`. File names match component names. Follow the existing patterns in `ArticleFeed.tsx`, `ArticleCard.tsx`, `ArticleDetailsModal.tsx`.

---

## Part 10 — Environment Variables

Add to `.env` (local) and as GitHub Actions secrets:

```env
# Locked Topics — AI Refinement (Gemini Flash)
GEMINI_API_KEY=your-google-ai-studio-key
# Get free key at: aistudio.google.com
# Free tier: 1,500 req/day, 1M tokens/day on gemini-2.0-flash

# Locked Topics — Brave Search
BRAVE_API_KEY=your-brave-api-key

# Locked Topics — Notifications
DISCORD_WEBHOOK_URL=your-discord-webhook-url
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Already required — confirm these exist in both .env and GitHub secrets:
REVALIDATE_SECRET=your-revalidate-secret
NEXT_PUBLIC_API_URL=https://your-deployed-frontend-url.vercel.app
```

**AI provider summary after this feature:**

| Provider             | Used For                                                         | Free Tier                    |
| -------------------- | ---------------------------------------------------------------- | ---------------------------- |
| Groq (Llama 4 Scout) | Ingestion pipeline + relevance scoring + on-demand summaries     | 30K TPM, 1K RPD              |
| Gemini Flash         | Topic creation AI refinement only (once per topic creation/edit) | 1,500 req/day, 1M tokens/day |
| OpenRouter           | Reserved — not used yet                                          | 50 req/day                   |

---

_End of document. Every decision is final as discussed. Build Phase 1 through 7 in order. Do not skip phases._
