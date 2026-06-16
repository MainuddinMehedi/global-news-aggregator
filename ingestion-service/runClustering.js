import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { processClusteringBatchWithAI } from "./clustering/ai.js";
import {
  selectClusterCandidates,
  detectEntityOverlap,
} from "./clustering/utils.js";
import {
  applyClusterLifecycle,
  saveClusteringResults,
} from "./clustering/db.js";
import revalidateCache from "./utils/revalidateCache.js";

const CLUSTER_LOW_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_LOW_IMPACT_INACTIVE_DAYS || "10",
  10,
);
const CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS || "21",
  10,
);
const CLUSTER_HIGH_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_HIGH_IMPACT_INACTIVE_DAYS || "35",
  10,
);
const CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS || "60",
  10,
);

const lifecycleConfig = {
  low: CLUSTER_LOW_IMPACT_INACTIVE_DAYS,
  medium: CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS,
  high: CLUSTER_HIGH_IMPACT_INACTIVE_DAYS,
  critical: CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS,
};

async function run() {
  console.log("🚀 Starting Story Clustering Worker...");

  // Apply basic lifecycle (time-based)
  await applyClusterLifecycle();

  // 1. Fetch HOLDING articles from last 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const holdingArticles = await prisma.processedArticle.findMany({
    where: {
      clusterStatus: "HOLDING",
      processedAt: { gte: fortyEightHoursAgo },
    },
    include: {
      rawArticle: true,
      categories: true,
    },
  });

  // Archive any HOLDING articles that are older than 48 hours (they missed the critical mass window)
  const archivedOld = await prisma.processedArticle.updateMany({
    where: {
      clusterStatus: "HOLDING",
      processedAt: { lt: fortyEightHoursAgo },
    },
    data: { clusterStatus: "ARCHIVED_UNCLUSTERED", clusteredAt: new Date() },
  });
  if (archivedOld.count > 0) {
    console.log(
      `🗄️  Archived ${archivedOld.count} holding articles older than 48 hours.`,
    );
  }

  if (holdingArticles.length === 0) {
    console.log("⏭️ No HOLDING articles found in the last 48 hours.");
    return;
  }

  console.log(
    `🔍 Found ${holdingArticles.length} HOLDING articles. Checking entity overlap...`,
  );

  // 2. Entity Overlap Detection
  const groups = detectEntityOverlap(holdingArticles);

  if (groups.length === 0) {
    console.log(
      "⏭️ No critical mass achieved (no group of 3+ articles with >= 2 matching entities).",
    );
    return;
  }

  console.log(
    `🎯 Achieved critical mass! Found ${groups.length} groups of overlapping articles.`,
  );

  // Load Active Clusters Context (Top 30)
  const activeClusterCandidates = await prisma.storyCluster.findMany({
    where: { isActive: true },
    orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: 60,
    include: {
      articles: {
        take: 3,
        orderBy: { processedAt: "desc" },
        include: { rawArticle: true, categories: true },
      },
    },
  });
  let activeClusters = selectClusterCandidates(activeClusterCandidates, 30);

  // Process each group
  for (const group of groups) {
    console.log(`\n🤖 Processing group of ${group.length} articles...`);

    // Chunk batched articles into safe groups of 5 to respect LLM tokens
    const chunk_size = 5;
    for (let i = 0; i < group.length; i += chunk_size) {
      const batch = group.slice(i, i + chunk_size);

      const batchWithRefs = batch.map((article, index) => ({
        ...article,
        aiRef: `article_${index + 1}`,
      }));

      // Update the active clusters refs for this chunk
      const activeClustersWithRefs = activeClusters.map((cluster, index) => ({
        ...cluster,
        aiRef: `cluster_${index + 1}`,
      }));

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
        activeClusters,
        activeClustersWithRefs,
        clusteringResponse,
      );
    }
  }

  // Decay momentum for all active clusters (reduces score slightly every hour)
  await prisma.storyCluster.updateMany({
    where: { isActive: true, momentumScore: { gt: 0 } },
    data: { momentumScore: { decrement: 0.5 } }, // Decrease by 0.5 every run
  });

  // Archive any stories that hit 0 momentum
  await prisma.storyCluster.updateMany({
    where: { isActive: true, momentumScore: { lte: 0 } },
    data: { isActive: false, status: "ARCHIVED" },
  });

  // Cap active clusters to Top 30
  const currentActive = await prisma.storyCluster.findMany({
    where: { isActive: true },
    orderBy: { momentumScore: "desc" },
  });

  if (currentActive.length > 30) {
    const toArchiveCount = currentActive.length - 30;
    const clustersToArchive = currentActive.slice(30); // Take the elements after the first 30
    const archiveIds = clustersToArchive.map((c) => c.id);

    console.log(
      `🧊 Archiving ${toArchiveCount} cold clusters to maintain max 30 active.`,
    );

    await prisma.storyCluster.updateMany({
      where: { id: { in: archiveIds } },
      data: { isActive: false, status: "ARCHIVED" },
    });
  }

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
