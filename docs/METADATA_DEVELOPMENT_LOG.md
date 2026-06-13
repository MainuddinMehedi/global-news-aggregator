# Metadata Foundation - Development Log & Documentation

This document records the architectural details, compatibility shifts, and database synchronization decisions made during the execution of the Metadata Foundation step.

---

## 1. Database Schema Synchronization

We updated the `RawArticle` database model in [schema.prisma](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/prisma/schema.prisma) to add `biasGroup` and `coverageScope` as optional string fields.

### Client Synchronization Policy
Depending on the state of the database and historical change records (i.e. if direct pushes were used previously), synchronization should be performed using one of the following methods:

1. **Standard Migration (Preferred):**
   ```bash
   npx prisma migrate dev --name add_metadata_fields
   ```
2. **Synchronization Fallback (If history is out-of-sync):**
   ```bash
   npx prisma db push
   npx prisma generate
   ```
   *Note: Always verify that client outputs are successfully regenerated in `shared/prisma-client`.*

---

## 2. Ingestion Service: `fetchRSSStream` Arguments

The `fetchRSSStream` function in [rss.js](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/ingestion-service/sources/rss.js) evolves from supporting 5 arguments to supporting 7 arguments:

```javascript
fetchRSSStream(sourceName, sourceCountry, sourceOrigin, sourceType, feedUrl, biasGroup, coverageScope)
```

### Legacy Callers & Compatibility
Topic scanners (`rssScanner.js` and `youtubeScanner.js`) invoke `fetchRSSStream` with a 3-argument signature:
```javascript
fetchRSSStream(sourceName, sourceCountry, feedUrl)
```

To prevent runtime failures or incorrect URL fetches:
- The function checks `arguments.length` dynamically.
- **If 3 arguments are passed:** Shifting logic assigns the 3rd argument to `feedUrl`, mapping all intermediate metadata parameters to `null`.
- **If 5 arguments are passed:** Shifting logic assigns the 5th argument to `feedUrl`.

### Future Refactoring Goal
All callers should eventually transition from positional parameters to a single options configuration object:
```javascript
fetchRSSStream({ sourceName, sourceCountry, sourceOrigin, sourceType, biasGroup, coverageScope, feedUrl })
```
This migration is scheduled for Step 2 of the roadmap.

---

## 3. Frontend UX Hierarchy & Filters

We strictly follow the UX hierarchy outlined in [METADATA_STRATEGY_OVERVIEW.md](file:///home/mainu/programming/projects/automation/geopolitical-news-monitor/global-news-aggregator/docs/METADATA_STRATEGY_OVERVIEW.md):

- **Primary Axis:** Category filters remain prominent at the top of the feed as quick navigations (low-effort discovery).
- **Secondary Axis (Visual Insights):** `sourceOrigin` and `biasGroup` are surfaced on article cards and sidebar analytics charts.
- **Tertiary Axis (Advanced Filters):** `sourceType` and `coverageScope`, along with manual `biasGroup` overrides, live inside the advanced **Filter Popover** to keep the interface clutter-free.

---

## 4. Summary of Code Adjustments

### A. Database and Ingestion Pipeline
- Modified the database schema to introduce optional `biasGroup` and `coverageScope` fields under `RawArticle` model.
- Handled backwards compatibility for 3-argument and 5-argument calls of `fetchRSSStream` from scanners.
- Integrated feed configurations and crawler parameters to populate fields on database ingestion.

### B. Core Queries & API Route Parameters
- **`getArticles` Query:** Updated `frontend/queries/articles.ts` to accept optional `bias` and `scope` strings and query the Prisma schema on relation subfields (`rawArticle: { biasGroup: ... }` and `rawArticle: { coverageScope: ... }`).
- **GET Articles Endpoint:** Modified `/api/articles` to parse and forward `bias` and `scope` parameters.
- **Home Feed Rendering:** Updated `frontend/app/page.tsx` to read search parameters and rebuild the React component tree key when filters change.

### C. Advanced Popover and Active Filters UI
- **`FilterPopover.tsx`:** Converted the filter layout into a 2x2 grid to host `Region`, `Type`, `Bias Leaning`, and `Coverage Scope` filters, using standard tooltips to explain their context.
- **`ActiveFilters.tsx`:** Updated search parameter cleanup and pill renders to display active selection tags for `Bias` and `Scope`.

### D. Root Layout & PPR Build Errors
- **`layout.tsx`:** Wrapped the root layout `{children}` block in a `<Suspense fallback={<FeedSkeleton />}>` boundary. This is required under PPR (`cacheComponents: true`) to allow Next.js to pre-render the static header/sidebar shell and defer dynamic page rendering (which accesses dynamic path `params` and `searchParams` on routes like `/article/[slug]`), resolving the `Blocking Route` prerender error.

### E. Multi-Source Perspective Pages
- **Story Details Mapping:** Modified `mapStoryArticleToArticle` inside `frontend/app/stories/[slug]/page.tsx` to align story articles array mapping with the new `biasGroup` and `coverageScope` type signatures.

### F. Dashboard Analytics Integration
- **`getAnalyticsData` Query:** Expanded the database query to read subfields `biasGroup` and `coverageScope` dynamically, and processed `biasGroupDistribution` and `coverageScopeDistribution` array objects.
- **`getBiasGroupCounts` API:** Added helper to aggregate processed articles grouped by their raw article's bias leaning.
- **Analytics Visualizer:** Integrated two new interactive donut charts representing Ideological Leaning and Coverage Scope distributions on the main analytics portal.

---

## 5. Phase 1.5 - Step 3 UX Refinements (Interactive Charts & Perspective Visualizations)

We refined the user experience of the metadata visualizers to bridge the gap between analytics and feed filtering, and introduced a linear comparison spectrum to illustrate geopolitical narrative variations.

### A. Dynamic Analytics Chart Filtering
- **`BiasDonutChart.tsx`:** Added a `filterParam` prop so each donut chart handles slice-clicks correctly.
  - Event Regions route to `/?region=...`
  - Bias Leaning routes to `/?bias=...`
  - Coverage Scope routes to `/?scope=...`
  This permits immediate interactive filtering directly from the analytics dashboard back to the home feed.

### B. Story Detail Narrative Comparison (`PerspectiveWidget.tsx`)
- Developed a dynamic **`PerspectiveWidget`** on the story details view (`/stories/[slug]`).
- The widget aggregates reporting counts and computes average sentiment scores for each publisher origin (e.g., North America, Europe, Middle East).
- It plots these origins along a linear spectrum representing sentiment tone (Favorable vs. Hostile) and raises a warning banner ("Perspective Delta Alert") if the difference (delta) in reporting sentiment between regions exceeds `0.25`.

### C. Story Card Geopolitical Origins
- Updated `getStoryClusters` in `frontend/queries/stories.ts` to query and map unique article origins (`sourceOrigin`) for each story.
- Modified `StoryCard.tsx` to list the reporting origins (e.g. `/ Origins: Middle East, Europe`) directly on the feed card. This highlights the geopolitical diversity of a story cluster before the user clicks to view details.
