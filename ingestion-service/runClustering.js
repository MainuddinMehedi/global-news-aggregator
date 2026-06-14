import "dotenv/config";
import { prisma } from "./db/prisma.js";
import { processClusteringBatchWithAI } from "./clustering/ai.js";
import {
  applyClusterLifecycle,
  selectClusterCandidates,
  getArticleSignals,
  buildClusterUpdateData,
  cleanString,
  cleanNumber,
} from "./clustering/helpers.js";

const CLUSTER_ASSIGNMENT_MIN_CONFIDENCE = Number.parseFloat(
  process.env.CLUSTER_ASSIGNMENT_MIN_CONFIDENCE || "0.55"
);
const CLUSTER_LOW_IMPACT_INACTIVE_DAYS = Number.parseInt(process.env.CLUSTER_LOW_IMPACT_INACTIVE_DAYS || "10", 10);
const CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS = Number.parseInt(process.env.CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS || "21", 10);
const CLUSTER_HIGH_IMPACT_INACTIVE_DAYS = Number.parseInt(process.env.CLUSTER_HIGH_IMPACT_INACTIVE_DAYS || "35", 10);
const CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS = Number.parseInt(process.env.CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS || "60", 10);

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
      processedAt: { gte: fortyEightHoursAgo }
    },
    include: {
      rawArticle: true,
      categories: true
    }
  });

  // Archive any HOLDING articles that are older than 48 hours (they missed the critical mass window)
  const archivedOld = await prisma.processedArticle.updateMany({
    where: {
      clusterStatus: "HOLDING",
      processedAt: { lt: fortyEightHoursAgo }
    },
    data: { clusterStatus: "ARCHIVED_UNCLUSTERED", clusteredAt: new Date() }
  });
  if (archivedOld.count > 0) {
    console.log(`🗄️  Archived ${archivedOld.count} holding articles older than 48 hours.`);
  }

  if (holdingArticles.length === 0) {
    console.log("⏭️ No HOLDING articles found in the last 48 hours.");
    return;
  }

  console.log(`🔍 Found ${holdingArticles.length} HOLDING articles. Checking entity overlap...`);

  // 2. Entity Overlap Detection (>= 2 entities, min 3 articles)
  const groups = [];
  const processedSet = new Set();

  for (let i = 0; i < holdingArticles.length; i++) {
    const article = holdingArticles[i];
    if (processedSet.has(article.id)) continue;
    if (!article.entities || article.entities.length === 0) continue;

    const currentGroup = [article];
    processedSet.add(article.id);

    for (let j = i + 1; j < holdingArticles.length; j++) {
      const otherArticle = holdingArticles[j];
      if (processedSet.has(otherArticle.id)) continue;
      if (!otherArticle.entities || otherArticle.entities.length === 0) continue;

      // Check for overlap of at least 2 identical entities
      const overlap = article.entities.filter(e => otherArticle.entities.includes(e));
      if (overlap.length >= 2) {
        currentGroup.push(otherArticle);
        processedSet.add(otherArticle.id);
      }
    }

    // Critical Mass: Only process groups with 3 or more articles
    if (currentGroup.length >= 3) {
      groups.push(currentGroup);
    } else {
      // Release from processed set so they can potentially match with something else next run
      for (const a of currentGroup) {
        processedSet.delete(a.id);
      }
    }
  }

  if (groups.length === 0) {
    console.log("⏭️ No critical mass achieved (no group of 3+ articles with >= 2 matching entities).");
    return;
  }

  console.log(`🎯 Achieved critical mass! Found ${groups.length} groups of overlapping articles.`);

  // Load Active Clusters Context (Top 30)
  const activeClusterCandidates = await prisma.storyCluster.findMany({
    where: { isActive: true },
    orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: 60,
    include: {
      articles: { take: 3, orderBy: { processedAt: "desc" }, include: { rawArticle: true, categories: true } },
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
      
      const articleIdByRef = new Map(batch.map((article, index) => [`article_${index + 1}`, article.id]));
      const batchWithRefs = batch.map((article, index) => ({ ...article, aiRef: `article_${index + 1}` }));
      
      // Update the active clusters refs for this chunk
      const activeClustersWithRefs = activeClusters.map((cluster, index) => ({ ...cluster, aiRef: `cluster_${index + 1}` }));

      let clusteringResponse;
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          clusteringResponse = await processClusteringBatchWithAI(batchWithRefs, activeClustersWithRefs, lifecycleConfig);
          success = true;
        } catch (err) {
          retries--;
          console.error(`❌ Clustering batch failed (Retries left: ${retries}):`, err.message);
          if (retries > 0) {
            await new Promise((r) => setTimeout(r, 5000));
          } else {
            console.error(`🚨 Fatal: Clustering batch completely failed. Skipping chunk.`);
          }
        }
      }

      if (!success) continue;

      let clusterData;
      try {
        clusterData = JSON.parse(clusteringResponse.content.replace(/```json|```/g, "").trim());
      } catch (err) {
        console.warn(`⚠️ Invalid JSON from clustering AI`);
        clusterData = { assignments: [], newClusters: [], clusterUpdates: [] };
      }

      const assignments = Array.isArray(clusterData.assignments) ? clusterData.assignments : [];
      const newClusters = Array.isArray(clusterData.newClusters) ? clusterData.newClusters : [];
      const clusterUpdates = Array.isArray(clusterData.clusterUpdates) ? clusterData.clusterUpdates : [];

      const activeClusterIds = new Set(activeClusters.map((c) => c.id));
      const activeClustersById = new Map(activeClusters.map((cluster) => [cluster.id, cluster]));
      const clusterIdByRef = new Map(activeClustersWithRefs.map((cluster) => [cluster.aiRef, cluster.id]));
      
      const resolveArticleId = (refOrId) => articleIdByRef.get(refOrId) || refOrId;
      const resolveClusterId = (refOrId) => clusterIdByRef.get(refOrId) || (activeClusterIds.has(refOrId) ? refOrId : null);
      
      const clusterUpdatesById = new Map(
        clusterUpdates
          .filter((update) => Boolean(resolveClusterId(cleanString(update?.clusterRef) || cleanString(update?.clusterId))))
          .map((update) => {
            const clusterId = resolveClusterId(cleanString(update.clusterRef) || cleanString(update.clusterId));
            return [clusterId, buildClusterUpdateData(update, activeClustersById.get(clusterId))];
          })
      );

      // Save new clusters
      for (const nc of newClusters) {
        try {
          const rawArticleRefs = Array.isArray(nc.articleRefs) ? nc.articleRefs : (Array.isArray(nc.articleIds) ? nc.articleIds : []);
          const validArticleIds = rawArticleRefs.map((refOrId) => resolveArticleId(cleanString(refOrId))).filter(Boolean);
          const uniqueArticleIds = [...new Set(validArticleIds)];

          if (uniqueArticleIds.length === 0) continue;

          // For the relationship, we need the rawArticleId
          const matchedBatchArticles = batch.filter(a => uniqueArticleIds.includes(a.id));
          const clusterSignals = getArticleSignals(matchedBatchArticles);
          
          // Connect using rawArticleId for ProcessedArticle
          const articlesToConnect = matchedBatchArticles.map((article) => ({
            rawArticleId: article.rawArticleId,
          }));

          const baseSlug = (nc.title || "story").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          const randomSuffix = Math.random().toString(36).substring(2, 7);
          let slug = `${baseSlug}-${randomSuffix}`;

          const newCluster = await prisma.storyCluster.create({
            data: {
              slug: slug,
              title: nc.title,
              summary: nc.summary,
              timeWindow: nc.timeWindow || "Just Started",
              impact: nc.impact || null,
              status: nc.status || null,
              momentumScore: 10, // Initialize with strong momentum
              whyItMatters: nc.whyItMatters || null,
              regions: nc.regions || [],
              themes: nc.themes || [],
              keyDevelopments: nc.keyDevelopments || [],
              lastActivityAt: new Date(),
              articleCount: clusterSignals.articleCount,
              sourceCount: clusterSignals.sourceCount,
              topSources: clusterSignals.topSources,
              articles: { connect: articlesToConnect },
            },
            include: { articles: true }
          });
          console.log(`+ Created new cluster: "${nc.title}"`);
          
          await prisma.processedArticle.updateMany({
            where: { id: { in: matchedBatchArticles.map(a => a.id) } },
            data: { clusterStatus: "CLUSTERED", clusteredAt: new Date() }
          });

          // Unshift so the next chunk in the loop has access to this new cluster!
          activeClusters.unshift(newCluster);
        } catch (err) {
          console.error(`⚠️ Failed to create new cluster: ${nc.title}`, err.message);
        }
      }

      // Update existing cluster assignments
      const assignedClusterIdsToRefresh = new Set();

      for (const assignment of assignments) {
        const articleRef = cleanString(assignment.articleRef) || cleanString(assignment.articleId);
        const clusterRef = cleanString(assignment.clusterRef) || cleanString(assignment.clusterId);
        if (!articleRef || !clusterRef) continue;

        const articleId = resolveArticleId(articleRef);
        const clusterId = resolveClusterId(clusterRef);
        const confidence = cleanNumber(assignment.confidence);

        if (!articleId || !clusterId) continue;
        if (confidence !== undefined && confidence < CLUSTER_ASSIGNMENT_MIN_CONFIDENCE) continue;

        try {
          const matchedArticle = batch.find(a => a.id === articleId);
          if (matchedArticle) {
            await prisma.processedArticle.update({
              where: { rawArticleId: matchedArticle.rawArticleId },
              data: {
                storyClusters: { connect: { id: clusterId } },
                clusterStatus: "CLUSTERED",
                clusteredAt: new Date()
              },
            });
            assignedClusterIdsToRefresh.add(clusterId);
          }
        } catch (err) {
          console.error(`⚠️ Failed to assign article ${articleRef} to cluster ${clusterRef}`, err.message);
        }
      }

      // Refresh metadata and momentum for updated clusters
      for (const clusterId of assignedClusterIdsToRefresh) {
        try {
          const clusterUpdate = clusterUpdatesById.get(clusterId) || {};
          const existingCluster = activeClustersById.get(clusterId);

          const newArticleIdsAssignedToThisCluster = assignments
            .filter((a) => resolveClusterId(cleanString(a.clusterRef) || cleanString(a.clusterId)) === clusterId)
            .map((a) => resolveArticleId(cleanString(a.articleRef) || cleanString(a.articleId)));

          const newArticlesAssignedToThisCluster = batch.filter((article) => newArticleIdsAssignedToThisCluster.includes(article.id));
          const combinedArticles = [...(existingCluster?.articles || []), ...newArticlesAssignedToThisCluster];
          const clusterSignals = getArticleSignals(combinedArticles);

          const updatedCluster = await prisma.storyCluster.update({
            where: { id: clusterId },
            data: {
              ...clusterUpdate,
              ...clusterSignals,
              momentumScore: { increment: newArticlesAssignedToThisCluster.length * 5 }, // Boost momentum for new articles
              updatedAt: new Date(),
              lastActivityAt: new Date(),
            },
          });

          const idx = activeClusters.findIndex((c) => c.id === clusterId);
          if (idx !== -1) {
            activeClusters[idx] = { ...activeClusters[idx], ...updatedCluster };
          }
        } catch (err) {
          console.error(`⚠️ Failed to refresh cluster ${clusterId}`, err.message);
        }
      }
      
      // Explicitly ignore unassigned articles so we don't spam the LLM in the next run
      const assignedArticleIds = new Set(
        [
          ...newClusters.flatMap(nc => (Array.isArray(nc.articleRefs) ? nc.articleRefs : (Array.isArray(nc.articleIds) ? nc.articleIds : [])).map(ref => resolveArticleId(cleanString(ref)))),
          ...assignments.map(a => resolveArticleId(cleanString(a.articleRef) || cleanString(a.articleId)))
        ].filter(Boolean)
      );

      const unassignedArticleIds = batch.map(a => a.id).filter(id => !assignedArticleIds.has(id));
      if (unassignedArticleIds.length > 0) {
        await prisma.processedArticle.updateMany({
          where: { id: { in: unassignedArticleIds } },
          data: { clusterStatus: "ARCHIVED_UNCLUSTERED", clusteredAt: new Date() }
        });
      }

      // Log AI Usage
      try {
        const today = new Date().toISOString().split("T")[0];
        const costPer1k = 0.0006;
        const estimatedCost = (clusteringResponse.tokensUsed / 1000) * costPer1k;
        await prisma.aiUsage.create({
          data: {
            date: today,
            provider: clusteringResponse.provider,
            model: clusteringResponse.model,
            tokensUsed: clusteringResponse.tokensUsed,
            estimatedCost: estimatedCost,
            success: true,
          },
        });
      } catch (err) {}
    }
  }

  // Decay momentum for all active clusters (reduces score slightly every hour)
  await prisma.storyCluster.updateMany({
    where: { isActive: true, momentumScore: { gt: 0 } },
    data: { momentumScore: { decrement: 0.5 } } // Decrease by 0.5 every run
  });

  // Archive any stories that hit 0 momentum
  await prisma.storyCluster.updateMany({
    where: { isActive: true, momentumScore: { lte: 0 } },
    data: { isActive: false, status: "ARCHIVED" }
  });

  // Cap active clusters to Top 30
  const currentActive = await prisma.storyCluster.findMany({
    where: { isActive: true },
    orderBy: { momentumScore: "desc" }
  });

  if (currentActive.length > 30) {
    const toArchiveCount = currentActive.length - 30;
    const clustersToArchive = currentActive.slice(30); // Take the elements after the first 30
    const archiveIds = clustersToArchive.map(c => c.id);
    console.log(`🧊 Archiving ${toArchiveCount} cold clusters to maintain max 30 active.`);
    await prisma.storyCluster.updateMany({
      where: { id: { in: archiveIds } },
      data: { isActive: false, status: "ARCHIVED" }
    });
  }

  console.log(`\n✅ Story Clustering complete.`);
  
  // Revalidate Cache
  try {
    const nextApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const revalidateSecret = process.env.REVALIDATE_SECRET || "";
    console.log(`🔄 Revalidating cache...`);
    const tagsToRevalidate = ["articles", "stories"];
    for (const tag of tagsToRevalidate) {
      await fetch(`${nextApiUrl}/revalidate?tag=${tag}&secret=${revalidateSecret}`);
    }
  } catch (err) {}

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
