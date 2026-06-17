import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { processClusteringBatchWithAI } from "./clustering/clusteringEngine.js";
import {
  detectEntityOverlap,
  selectRelevantClusterCandidates,
} from "./clustering/utils/index.js";
import {
  applyClusterLifecycle,
  saveClusteringResults,
  CLUSTER_LOW_IMPACT_INACTIVE_DAYS,
  CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS,
  CLUSTER_HIGH_IMPACT_INACTIVE_DAYS,
  CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS,
} from "./clustering/lifecycle.js";
import revalidateCache from "./utils/revalidateCache.js";

const lifecycleConfig = {
  low: CLUSTER_LOW_IMPACT_INACTIVE_DAYS,
  medium: CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS,
  high: CLUSTER_HIGH_IMPACT_INACTIVE_DAYS,
  critical: CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS,
};
const CLUSTER_HOLDING_WINDOW_HOURS = Number.parseInt(
  process.env.CLUSTER_HOLDING_WINDOW_HOURS || "168",
  10,
);
const CLUSTER_CANDIDATE_POOL_LIMIT = Number.parseInt(
  process.env.CLUSTER_CANDIDATE_POOL_LIMIT || "200",
  10,
);
const CLUSTER_LLM_CANDIDATE_LIMIT = Number.parseInt(
  process.env.CLUSTER_LLM_CANDIDATE_LIMIT || "30",
  10,
);
const CLUSTER_MIN_ENTITY_OVERLAP = Number.parseInt(
  process.env.CLUSTER_MIN_ENTITY_OVERLAP || "2",
  10,
);
const CLUSTER_MIN_GROUP_SIZE = Number.parseInt(
  process.env.CLUSTER_MIN_GROUP_SIZE || "3",
  10,
);

async function run() {
  console.log("🚀 Starting Story Clustering Worker...");

  // Apply basic lifecycle (time-based)
  await applyClusterLifecycle();

  // 1. Fetch HOLDING articles from the holding window. Default is 7 days so
  // low-volume strategic stories can accumulate enough evidence.
  const holdingWindowStart = new Date(
    Date.now() - CLUSTER_HOLDING_WINDOW_HOURS * 60 * 60 * 1000,
  );
  const holdingArticles = await prisma.processedArticle.findMany({
    where: {
      clusterStatus: "HOLDING",
      processedAt: { gte: holdingWindowStart },
    },
    include: {
      rawArticle: true,
      categories: true,
    },
  });

  // Archive HOLDING articles that aged out of the accumulation window.
  const archivedOld = await prisma.processedArticle.updateMany({
    where: {
      clusterStatus: "HOLDING",
      processedAt: { lt: holdingWindowStart },
    },
    data: { clusterStatus: "ARCHIVED_UNCLUSTERED", clusteredAt: new Date() },
  });
  if (archivedOld.count > 0) {
    console.log(
      `🗄️  Archived ${archivedOld.count} holding articles older than ${CLUSTER_HOLDING_WINDOW_HOURS} hours.`,
    );
  }

  if (holdingArticles.length === 0) {
    console.log(
      `⏭️ No HOLDING articles found in the last ${CLUSTER_HOLDING_WINDOW_HOURS} hours.`,
    );
    return;
  }

  console.log(
    `🔍 Found ${holdingArticles.length} HOLDING articles. Checking entity overlap...`,
  );

  // 2. Entity Overlap Detection
  const groups = detectEntityOverlap(holdingArticles);

  if (groups.length === 0) {
    console.log(
      `⏭️ No critical mass achieved (no group of ${CLUSTER_MIN_GROUP_SIZE}+ articles with >= ${CLUSTER_MIN_ENTITY_OVERLAP} matching entities).`,
    );
    return;
  }

  console.log(
    `🎯 Achieved critical mass! Found ${groups.length} groups of overlapping articles.`,
  );

  // Load a broad active story pool. Each article group selects its own most
  // relevant candidates before going to the LLM.
  const activeClusterCandidates = await prisma.storyCluster.findMany({
    where: { isActive: true },
    orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: CLUSTER_CANDIDATE_POOL_LIMIT,
    include: {
      articles: {
        take: 5,
        orderBy: { processedAt: "desc" },
        include: { rawArticle: true, categories: true },
      },
    },
  });
  let activeClusters = activeClusterCandidates;

  // Process each group
  for (const group of groups) {
    console.log(`\n🤖 Processing group of ${group.length} articles...`);

    // Chunk batched articles into safe groups of 5 to respect LLM tokens
    const chunk_size = 5;
    for (let i = 0; i < group.length; i += chunk_size) {
      const batch = group.slice(i, i + chunk_size);
      const activeClustersForBatch = selectRelevantClusterCandidates(
        batch,
        activeClusters,
        CLUSTER_LLM_CANDIDATE_LIMIT,
      );

      const batchWithRefs = batch.map((article, index) => ({
        ...article,
        aiRef: `article_${index + 1}`,
      }));

      // Update the active clusters refs for this chunk
      const activeClustersWithRefs = activeClustersForBatch.map(
        (cluster, index) => ({
          ...cluster,
          aiRef: `cluster_${index + 1}`,
        }),
      );

      let clusteringResponse;
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          clusteringResponse = await processClusteringBatchWithAI(
            batchWithRefs,
            activeClustersWithRefs,
            lifecycleConfig,
          );
          success = true;
        } catch (err) {
          retries--;
          console.error(
            `❌ Clustering batch failed (Retries left: ${retries}):`,
            err.message,
          );
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 5000));
          } else {
            console.error(
              `🚨 Fatal: Clustering batch completely failed. Skipping chunk.`,
            );
          }
        }
      }

      if (!success) continue;

      // Save clustering results using helper function
      await saveClusteringResults(
        batch,
        activeClustersForBatch,
        activeClustersWithRefs,
        clusteringResponse,
      );

      const knownClusterIds = new Set(activeClusters.map((cluster) => cluster.id));
      for (const cluster of activeClustersForBatch) {
        if (!knownClusterIds.has(cluster.id)) {
          activeClusters.unshift(cluster);
          knownClusterIds.add(cluster.id);
        }
      }
    }
  }

  // Decay momentum for all active clusters (reduces score slightly every hour)
  await prisma.storyCluster.updateMany({
    where: { isActive: true, momentumScore: { gt: 0 } },
    data: { momentumScore: { decrement: 0.5 } }, // Decrease by 0.5 every run
  });

  console.log(`\n✅ Story Clustering complete.`);

  // Revalidate Cache
  await revalidateCache(["articles", "stories"]);
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
