# Story Feature Overview

This document provides a comprehensive developer guide to the Story Clustering feature of the Global News Aggregator. It outlines the end-to-end process from how articles are ingested to how they are grouped into tracking narratives (Stories).

## 1. Architectural Philosophy

Stories represent evolving narratives over time (e.g., "The Israel-Hamas Conflict" or "OpenAI Leadership Shakeup"). Instead of clustering articles at the moment of ingestion (which leads to premature categorization or missing context), we use a **Decoupled Architecture**.

Articles are ingested frequently (e.g., every 15 minutes) and placed into a "Holding Tank". A separate, asynchronous process (the "Clustering Worker", running e.g., every hour) processes these holding articles in bulk. This allows the system to build confidence that an event is actually a "Story" by waiting for critical mass (multiple publications covering the same entities).

## 2. The Data Model

The feature relies on two primary models in the Prisma schema:

### `ProcessedArticle`
- **`clusterStatus`**: Represents the article's state in the clustering pipeline.
  - `HOLDING`: Freshly ingested, waiting to be clustered.
  - `CLUSTERED`: Successfully assigned to a story.
  - `ARCHIVED_UNCLUSTERED`: Ignored by the AI or too old (decayed out of the 48-hour window) and thus archived.
- **`clusteredAt`**: Timestamp of when the cluster status last changed.
- **`storyClusters`**: A many-to-many relationship linking articles to stories.

### `StoryCluster`
- **`momentumScore`**: A numeric score indicating how "hot" a story is. It increases when new articles are added and decays over time.
- **`status`**: String indicating lifecycle state (e.g., `ESCALATING`, `DEVELOPING`, `STABLE`, `ARCHIVED`).
- **`isActive`**: Boolean flag. Only the Top 30 active stories are maintained as context for the AI.

## 3. The Clustering Pipeline (`runClustering.js`)

The actual clustering logic is executed by the script `ingestion-service/runClustering.js`. Here is the step-by-step workflow:

### Step 1: Querying the Holding Tank
The worker queries the database for all `ProcessedArticle` records where `clusterStatus = "HOLDING"` and `processedAt` is within the last 48 hours. Any articles older than 48 hours still in HOLDING are automatically transitioned to `ARCHIVED_UNCLUSTERED`.

### Step 2: Entity Overlap Detection
Before sending data to the AI (which is expensive and rate-limited), we perform a deterministic local pass. The system looks for "Critical Mass":
- Articles are compared against each other based on their extracted `entities` (PERSON, ORG, GPE, LOC).
- If an article shares at least **2 identical entities** with another article, they are grouped together.
- A group must contain at least **3 articles** to trigger an AI clustering request.
If an article does not meet this threshold, it remains in `HOLDING` for the next run (until it expires after 48 hours).

### Step 3: AI Context Preparation
The Top 30 `isActive = true` Story Clusters are loaded from the database, ranked by their `momentumScore` and recent activity. These serve as the "Memory" or "Billboard" context for the AI. 
By capping context at 30 stories, we ensure we respect the strict 12k TPM (Tokens Per Minute) limit of our models (`llama-3.3-70b-versatile`).

### Step 4: Token-Safe Chunking
The grouped articles are sliced into chunks of 5 articles each. This ensures that the context window (Top 30 Stories + 5 New Articles) remains well within the token limits. 

### Step 5: The AI Decision
The AI (via `processClusteringBatchWithAI` in `client.js`) is asked: *"Do these 5 articles belong to one of our 30 active stories, or do they represent a completely new evolving story?"*
- The AI can assign articles to existing clusters.
- The AI can create new clusters (if it detects a new narrative).
- The AI updates the summary, timeWindow, impact, and key developments of affected clusters.

### Step 6: Database Updates & Momentum
- The script applies the AI's assignments to the database.
- Processed articles are transitioned to `clusterStatus: "CLUSTERED"`.
- Assigned clusters receive a boost to their `momentumScore`.
- Any unassigned articles from the chunk are marked as `ARCHIVED_UNCLUSTERED`.

### Step 7: Decay and Archiving
At the end of the run:
- All active stories suffer a slight `momentumScore` decay.
- If a story's momentum drops to 0, it is archived (`isActive = false`).
- If there are more than 30 active stories, the stories with the lowest momentum are archived to strictly maintain the top 30 cap.
- The Next.js API revalidation webhook is triggered to refresh the frontend.

## 4. Running the Process

The ingestion and clustering are decoupled commands:

- **Ingestion**: `npm run ingest` (Fetches RSS, processes via local ML, saves as HOLDING).
- **Clustering**: `npm run cluster` (Runs the `runClustering.js` pipeline).

In a production environment, `ingest` might run every 15 minutes, while `cluster` runs every 1-2 hours.

## 5. Adding New Properties to Stories

If you need to add a new property to a `StoryCluster` (e.g., `primaryCategory`):
1. Add the field to `schema.prisma`.
2. Run `npx prisma migrate dev`.
3. Update the prompt in `ingestion-service/ai/client.js` inside `processClusteringBatchWithAI` to instruct the AI to output this new field.
4. Update `buildClusterUpdateData` in `ingestion-service/ai/processor.js` to extract and clean the new field from the AI's JSON output.
5. Ensure `runClustering.js` passes the new field during the `.create()` call for new clusters.
