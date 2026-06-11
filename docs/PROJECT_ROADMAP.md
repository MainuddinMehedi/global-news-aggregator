# Global News Aggregator - Project Roadmap & Remaining Tasks

This document serves as the master checklist and brainstorming board for the remaining tasks in the project. Features are broken down by priority and scope.

---

## 1. Data Ingestion & Quality (High Priority)

### 1.1 Feed List Curation & Automation

- **Current State:** The crawler currently relies on 7-8 testing RSS feeds. The ingestion automation is turned off.
- **Action Items:**
  - Curate a comprehensive, high-quality list of global RSS feeds spanning various regions, perspectives, and topics.
  - **Automation Decision:** Choose between **GitHub Actions** (simple cron, code-centric, free) vs **n8n** (visual workflow, robust error handling, self-hosted/cloud).
  - Activate the scheduled ingestion pipeline.

### 1.2 The 3-Axis Filter Architecture (Revamp)

- **The Problem:** We are currently confusing the publisher's origin with the event's location. We need to categorize news across three distinct axes to allow deep analytical filtering:
  1. **`Event Region` (What is the news about?):** The geographical subject of the article. _Extracted by AI._ Predefined values: 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'. AI instruction: "Extract the geographical subject: exactly one of 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'. Assign to 'eventRegion'."
  2. **`Source Origin` (Where is the publisher based?):** The geopolitical base of the news outlet. _Hardcoded on RSS Feed._ Predefined values: 'North America', 'Europe', 'Middle East', 'Asia-Pacific', 'Latin America', 'Africa', 'Global'.
  3. **`Source Type` (What kind of publisher is it?):** The editorial structure of the publisher. _Hardcoded on RSS Feed._ (e.g., State Media, Independent Wire, Commercial Publisher, Amplifier/Aggregator).
- **Why this works:** It unlocks incredibly smart filtering. A user can say: _"Show me news about the **Middle East** (Event Region) reported by **State Media** (Source Type) from **Asia** (Source Origin)."_

Changing the rss feed structure changes how we take input(feed) from user and how i as an admin add feeds.

---

## 2. User Experience & Scopes (High Priority)

### 2.1 UI/UX Design Consistency

- **Current State:** There are minor layout and visual differences between the "Story" views and "Locked Topics" views.
- **Action Item:** Audit both pages and unify the design language (typography, spacing, card layouts, header styles).

### 2.2 Side-by-Side "Compare" Feature

- **Concept:** Since multiple sources cover the same event (Story Clusters), allow users to select an event and view how different `Source Types` or `Source Origins` covered it side-by-side.
- **Example:** Compare NYT (Commercial, US) coverage of an event vs. Xinhua (State Media, China) coverage of the exact same event.

### 2.3 User Scopes & Authentication

- **Current State:** No strict differentiation between public visitors, authenticated users, and admins.
- **Action Items (Defining Scopes):**
  - **Public User:** Can view the feed, read stories, search, and view public "News Insights" (Perspective Donut, Bias Distribution, Event Clusters, Topic Radar).
  - **Authenticated User:** Can bookmark articles, customize feed preferences, and subscribe to notifications for specific Topics/Stories.
  - **Admin:** Has exclusive access to the Admin Dashboard (system telemetry, controls, user management).

---

## 3. Admin Dashboard (Medium Priority)

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
