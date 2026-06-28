# Admin Dashboard: Immediate Action Board

This action board lists the step-by-step phases required to implement the complete Admin Dashboard.

## Phase 1: Database Schema & Migration

- [x] Add `FeedSource`, `SystemSetting`, and `SystemTask` models to [schema.prisma](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/prisma/schema.prisma).
- [x] Add `suspended` Boolean field to the `User` model in `schema.prisma`.
- [x] Generate database migration: `npx prisma migrate dev --name init_admin_models`.
- [x] Write a seeding script to populate `FeedSource` from the current `builtinFeeds` list inside [feeds.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/data/feeds.js).
- [x] Update `ingestion-service/data/feeds.js` to query the `FeedSource` database table for active feeds instead of hardcoded imports.

## Phase 2: Shell & Tabbed Layout Componentry

- [x] Update [AdminLayout](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/app/system-supar-admin/layout.tsx) (and global layout.tsx) to verify if `session.user.suspended === true` and reject/sign out suspended accounts.
- [x] Design the tab wrapper layout inside [page.tsx](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/frontend/app/system-supar-admin/page.tsx) with elegant tab-switching using Tailwind CSS, including:
  - System Health & Task Observability
  - Source Control Center
  - AI Engine Settings
  - User Administration
  - Caching & Skipped Backlog
- [x] Add a sub-navigation sidebar or horizontal navigation utilizing modern frosted Glassmorphism CSS variables and micro-animations.

## Phase 3: Tab 1 — System Health & Task Analytics

- [x] Implement query methods in `frontend/queries/analytics.ts` to retrieve running tasks, task log stats, and historical ingestion/clustering volumes.
- [x] Integrate background workers (Ingest pipeline, story clustering, locked topic scanners) to write heartbeats and status logs to `SystemTask` at start, during, and end of execution.
- [x] Build the telemetry charts (fetched vs. processed vs. clustered) using Recharts in Tab 1.
- [x] Implement the collapsible Collated System Errors console component to show recent errors from `SystemTask`.

## Phase 4: Tab 2 — Source Control Center

- [x] Build `FeedSource` CRUD table component with columns: Name, URL, Country, Bias Profile, Scope, Actions.
- [x] Build Add/Edit Modal forms matching the 3-axis filters, and hook them to Next.js Server Actions.
- [x] Build toggle action to enable/disable specific feeds, calling `toggleFeedSource`.
- [x] Add a "Reset Fail-counters" button to clear crawler error counts.
- [x] Add "Trigger Ingestion" button to execute runIngest asynchronously via a worker thread or server route.

## Phase 5: Tab 3 — AI Engine Configs & Token Telemetry

- [x] Add Form fields to load and override properties of `primaryConfig` and `fallbackConfig` (saved as overrides in `SystemSetting`).
- [x] Add "Pause AI Ingestion" toggle switch overriding LLM processing globally in the pipeline.
- [x] Render the token utilization line chart and cumulative API cost estimation graphs in Tab 3.

## Phase 6: Tab 4 — User Administration

- [x] Build the User list table querying registered users with details: name, email, role, suspended state.
- [x] Implement role promotion/demotion action button (`promoteToAdmin` / `demoteToUser`).
- [x] Implement account suspension toggle action button (`suspendUser` / `unsuspendUser`), instantly invalidating dynamic sessions for the user.

## Phase 7: Tab 5 — Skipped Articles & Gazetteer Sandbox

- [x] Build Skipped Articles Diagnostic Table showing raw articles where `clusterStatus === "SKIPPED"` (Category is `"other"`).
- [x] Implement the Interactive selection sandbox: copy context from analyzed articles to define new rules.
- [x] Hook the "Add to Gazetteer" form to a server action that writes back to `gazetteer.json`.
- [x] Implement "Force Re-categorize" server action to clear skipped status, update category, and queue the raw article for Stage 2 processing.
- [x] Build Failed Enrichments table for articles stuck in `FAILED_ENRICHMENT`, with "Retry Selected" and "Discard Failure" controls.

## Phase 8: Verification & Polish

- [x] Write integration checks ensuring `/system-supar-admin` rejects non-admin users with appropriate HTTP 403 / redirect.
- [x] Verify database schema constraints under concurrent operations (e.g. run multiple ingestion tasks).
- [x] Verify Next.js 16 caching and tags revalidation function correctly for the new dashboard telemetry.

## Deferred / Optional Tasks

- [ ] Add inline progress spinner/status indicator in Source Control Center during manual ingestion runs.

