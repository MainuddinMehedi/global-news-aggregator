# Metadata Audit & Feed Curation Guide

## Part 1: Metadata Update Audit

Adding `biasGroup` and `coverageScope` to the feed sources requires changes across the database, ingestion pipeline, and frontend. Here is a comprehensive checklist of every file and component that needs your attention.

### 1. Database Schema (`prisma/schema.prisma`)
- **`RawArticle` Model:** Add `biasGroup String?` and `coverageScope String?`.
- **`ProcessedArticle` Model:** If you duplicate metadata here for faster queries (optional but recommended for filtering), add them here too.
- *Action:* Run `npx prisma migrate dev` after updating.

### 2. Ingestion Service
- **`ingestion-service/sources/feeds.js`:**
  - Update the `builtinFeeds` array to include the new fields.
  - Update `getAllFeeds()` user mapping to default/fallback missing `biasGroup` and `coverageScope`.
- **`ingestion-service/sources/rss.js`:**
  - Ensure the feed parser maps `biasGroup` and `coverageScope` from the feed configuration into the object it yields.
- **`ingestion-service/index.js`:**
  - When calling `prisma.rawArticle.create` (or upsert), ensure `biasGroup` and `coverageScope` are passed in the data payload.
- **`ingestion-service/ai/client.js`:**
  - *Opportunity:* In `buildBatchPrompt`, pass the `biasGroup` and `sourceType` along with the article title/snippet. This will significantly help the AI fulfill Step 4 of the prompt ("Note any detectable bias or perspective") because it will know the inherent bias of the publisher before analyzing the text.

### 3. Frontend: Types & State
- **`frontend/types/article.ts`:** Add `biasGroup?: string` and `coverageScope?: string` to the `Article` interface.
- **`frontend/store/index.ts`:** If you plan to add these as global filters in the UI, add them to the Zustand store.

### 4. Frontend: Settings & Inputs (User adding feeds)
- **`frontend/components/settings/ManageSourcesModal.tsx` & `SourcesSection.tsx`:**
  - Add dropdown inputs (Select components) for users to choose a `Bias Group` and `Coverage Scope` when they add a custom RSS URL.
  - Make sure the form submits these new fields to the database user settings.

### 5. Frontend: UI & Display (Cards and Details)
- **`frontend/components/articles/ArticleCard.tsx`:** 
  - Add a small badge or icon indicating the `biasGroup` (e.g., a colored dot: blue for left, red for right, grey for centrist) or just text if it fits.
- **`frontend/components/articles/ArticleDetailsModal.tsx`:**
  - Add the new metadata fields to the "Based in..." metadata section.
- **`frontend/app/article/[slug]/page.tsx` & `frontend/app/stories/[slug]/page.tsx`:**
  - Display the new fields in the metadata header alongside `sourceOrigin`.

### 6. Frontend: Data Fetching & Analytics
- **`frontend/queries/articles.ts`:**
  - Support filtering by `biasGroup` in the `where` clause if you add it to the `<Filters />` component.
- **`frontend/queries/analytics.ts`:**
  - *Crucial:* The `BiasDistributionWidget` currently relies on AI sentiment or hardcoded structures. You can now use Prisma `groupBy` on `biasGroup` directly from `RawArticle` to populate this widget accurately.


---

## Part 2: AI Collaboration Prompts for Feed Curation

Don't ask an AI to "give me all feeds." Instead, use it as a research assistant to fill in specific gaps based on our tier strategy. Use the prompts below in ChatGPT, Claude, or Gemini.

### Prompt 1: Filling the Regional Gaps
**Use this when you want to find sources for a specific region.**
> "I am building a geopolitical news aggregator. I need to populate my 'Tier 2' sources for the **[INSERT REGION, e.g., Middle East]**. 
> Please give me a list of 5-7 major English-language news publishers based in this region. 
> I need a mix of State Media and Commercial Publishers to get diverse perspectives. 
> For each, provide:
> 1. The name of the publisher.
> 2. The country it is based in.
> 3. Who funds/owns it (State or Commercial).
> 4. Its general ideological leaning or geopolitical alignment.
> 5. The exact URL for their main Top News or World News RSS/Atom feed."

### Prompt 2: Finding Counter-Perspectives (The Power Groups)
**Use this when you want to balance a Western-heavy feed list.**
> "My geopolitical news aggregator currently has a lot of Western commercial media (NYT, BBC, Reuters). I need to balance this with 'Non-Western' or 'BRICS' perspectives to capture differing geopolitical narratives.
> Please provide 5-8 English-language RSS feeds from major state-aligned or commercial media outlets based in Russia, China, India, Brazil, or South Africa. 
> Please format the output as a JSON array matching this schema:
> `[{ name, sourceCountry, sourceOrigin, sourceType, biasGroup, coverageScope, url }]`
> Use standard region names for sourceOrigin (e.g., 'Asia-Pacific', 'Latin America')."

### Prompt 3: Deep-Dive Local Focus
**Use this for specific countries of interest (like Bangladesh).**
> "I need to monitor the domestic and foreign policy of **[INSERT COUNTRY]** very closely. 
> Please find me 3-5 reliable English-language RSS feeds from local publishers based in this country. 
> Prioritize feeds that provide full article descriptions rather than just headlines. 
> Tell me the publisher's name, their general political leaning (if any), and the RSS feed URL."

### Prompt 4: Validating RSS Feeds
**Use this when you have a list but aren't sure if the RSS feeds are active.**
> "Here is a list of news publishers I want to add to my aggregator: **[List publishers]**.
> Can you verify or search for their official, active RSS feed URLs for their 'World News' or 'Top Stories' sections? Please only provide feeds that are currently working and formatted in standard XML."
