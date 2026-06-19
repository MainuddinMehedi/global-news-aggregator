# Global News Aggregator - Project Roadmap & Remaining Tasks

This document serves as the master checklist and brainstorming board for the remaining tasks in the project. Features are broken down by priority and scope.

---

## 🚀 Immediate Action Board: 

- [ ] **Feed Curation (Scale Up)**
- [ ] 


## Deployment Checklist

Before the application goes live in a production environment (e.g., Render/Vercel), the following critical path items must be verified or built:

- [ ] **1. Production Build Verification:** Run `npm run build` locally to flush out any hidden TypeScript type mismatches or ESLint errors that could crash the deployment pipeline.
- [ ] **2. Database Pruning Script:** Write a cron script (`cleanupOldArticles.js`) and attach it to `masterWorker` to delete rows older than 30-60 days to prevent runaway PostgreSQL storage costs.
- [ ] **3. Environment Variables Audit:** Ensure all local `.env` variables are seeded in production, specifically including `REVALIDATE_SECRET` and `FRONTEND_URL` (essential for background worker cache-clearing).
- [ ] **4. Two-Service Architecture Provisioning:** Configure the host to run **two** separate instances:
      - *Frontend Service:* Running `npm start` (Next.js web layer).
      - *Background Service:* Running `npm run worker` (pg-boss pipeline engine).


---

## 1. Data Ingestion & Quality (High Priority)

### 1.1 Feed List Curation & Automation

- **Current State:** The crawler currently relies on 7-8 testing RSS feeds. The ingestion automation is turned off.
- **Action Items:**
  - Curate a comprehensive, high-quality list of global RSS feeds spanning various regions, perspectives, and topics.
  - **Automation Decision:** Choose between **GitHub Actions** (simple cron, code-centric, free) vs **n8n** (visual workflow, robust error handling, self-hosted/cloud).
  - Activate the scheduled ingestion pipeline.

### 1.2 The 3-Axis Filter Architecture (Revamp) ✅ [COMPLETED]

- **The Problem:** We are currently confusing the publisher's origin with the event's location. We need to categorize news across three distinct axes to allow deep analytical filtering:
  1. **`Event Region` (What is the news about?):** The geographical subject of the article. _Extracted by AI._ Predefined values: 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'. AI instruction: "Extract the geographical subject: exactly one of 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'. Assign to 'eventRegion'."
  2. **`Source Origin` (Where is the publisher based?):** The geopolitical base of the news outlet. _Hardcoded on RSS Feed._ Predefined values: 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'.
  3. **`Source Type` (What kind of publisher is it?):** The editorial structure of the publisher. _Hardcoded on RSS Feed._ (e.g., State Media, Independent Wire, Commercial Publisher, Amplifier/Aggregator).
- **Why this works:** It unlocks incredibly smart filtering. A user can say: _"Show me news about the **Middle East** (Event Region) reported by **State Media** (Source Type) from **Asia** (Source Origin)."_

Changing the rss feed structure changes how we take input(feed) from user and how i as an admin add feeds.

---

## 2. User Experience & Scopes (High Priority)

### 2.2 Side-by-Side "Compare" Feature

- **Concept:** Since multiple sources cover the same event (Story Clusters), allow users to select an event and view how different `Source Types` or `Source Origins` covered it side-by-side.
- **Example:** Compare NYT (Commercial, US) coverage of an event vs. Xinhua (State Media, China) coverage of the exact same event.

---

## 3. Deploy-Readiness & Maintenance (New Priorities)

### 3.1 Database Pruning (Cost Management)

- [ ] Write a cron job script (`cleanupOldArticles.js`) to permanently delete `RawArticle` and `ProcessedArticle` rows older than 30-60 days.
- [ ] Ensure bookmarked or saved articles are protected from deletion.
- [ ] Add a `prune-queue` to the `masterWorker.js` to run this cleanup weekly.

### 3.2 Error & Telemetry Tracking

- [ ] Integrate an error-tracking service (e.g., Sentry, GlitchTip) into the ingestion pipeline.
- [ ] Wrap `masterWorker` background jobs so that failures automatically send alerts (email/Discord) rather than dying silently in the console logs.

### 3.3 Horizontal Scaling Note (Rate Limiter)

- **Warning/Note:** The AI Rate Limiter (`rateLimiter.js`) currently lives in the Node.js memory. This is perfectly fine for a single `masterWorker` instance. However, if the app scales horizontally (multiple Render instances parsing the backlog), these in-memory limiters will not communicate, leading to 429 Too Many Requests errors from Groq.
- **Action Item if Scaling:** Migrate the rate limiter state from in-memory to PostgreSQL or Redis before adding more worker dynos.

---

## 4. Admin Dashboard (Medium Priority)

_Goal: Provide full observability and control over the system. Build mandatory features first, then elevate._

### Phase 1: Mandatory Controls (\*\*\*)

- **Source Control:** UI to add, remove, pause, or edit RSS feeds. Monitor which sources are active or failing.
- **User List:** View registered users, manage roles (admin vs user), and handle account suspensions.
- **AI Settings & Control:** Toggle models (e.g., switch to a fallback model if rate-limited), adjust prompts, or pause AI enrichment entirely to save costs.
- **Overall AI Usage Metrics:** Token usage, estimated API costs, and active model telemetry. _(Note: This data is currently on the public analytics page and needs to be moved here)._
- **Overall System Health Check:** Centralized error logs ("errors from all over") and crawler success vs. failure rates.

### Phase 2: Elevated / Secondary Features

- **Ingestion Pipeline Settings:** Granular controls for deduplication thresholds, crawler frequency, and concurrency limits.
- **Complete Analysis / Graph Charts:** Detailed graphs showing the ingestion rate vs. story creation rate over time.

#### My notes

- I can have a section showing the current run of the ingestion pipeline or locked topics scanners or automatic processes. Like it may show me - running ingestion pipeline.
  or - running scanners.
  the intuition is to see when my automated processes are running. whether they are running fine or stuck or stopped or failed or overlapped etc.

---

## 4. Notifications (Medium/Low Priority)

- **Current State:** A notification slice exists in Zustand but acts as a stub.
- **Action Items:**
  - Implement a notification engine for authenticated users.
  - Define triggers: "New finding in your Locked Topic", "A major story cluster just formed", etc.
  - **Delivery Channels:** Decide between an in-app bell icon/drawer, Email digests, or integrations like Discord/Telegram.

---

## Completed Tasks



---
## Future Notes

- **Admin Feed Configuration:** As noted in 1.2 ("Changing the rss feed structure changes how we take input(feed) from user and how i as an admin add feeds"), we need to ensure the admin dashboard (when built) easily allows assigning `Source Origin` and `Source Type` to newly curated RSS feeds.
- **Cleanup:** `perspectiveCountries` has been successfully purged from the DB schema to rely purely on `rawArticle.sourceCountry`, reducing duplication.
- **Clustering Architecture Upgrade (Embeddings):** Currently, story clustering relies heavily on passing all active clusters into an LLM prompt. To solve context-window scaling limits, the roadmap includes migrating to a hybrid embedding model. Articles will be converted to vectors via Gemini Embeddings (or similar) and grouped using Supabase `pgvector` (cosine similarity). The LLM will then be used exclusively to summarize and generate intelligence metadata for the resulting clusters, drastically reducing token usage and allowing infinite scale.
