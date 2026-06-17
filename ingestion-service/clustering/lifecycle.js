import { prisma } from "../db/prisma.js";
import {
  cleanString,
  cleanNumber,
  buildClusterUpdateData,
  getArticleSignals,
} from "./utils/index.js";
import { logAiUsage } from "../utils/logAiUsage.js";
import { generateSlug } from "../utils/generateSlug.js";

const DAY_MS = 24 * 60 * 60 * 1000;
export const CLUSTER_STABLE_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_INACTIVE_DAYS || "7",
  10,
);
export const CLUSTER_LOW_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_LOW_IMPACT_INACTIVE_DAYS || "10",
  10,
);
export const CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS || "21",
  10,
);
export const CLUSTER_HIGH_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_HIGH_IMPACT_INACTIVE_DAYS || "35",
  10,
);
export const CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS || "60",
  10,
);
const CLUSTER_ASSIGNMENT_MIN_CONFIDENCE = Number.parseFloat(
  process.env.CLUSTER_ASSIGNMENT_MIN_CONFIDENCE || "0.55",
);

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

function inactiveByActivityCutoff(cutoff) {
  return {
    OR: [
      { lastActivityAt: { lt: cutoff } },
      { lastActivityAt: null, updatedAt: { lt: cutoff } },
    ],
  };
}

export async function applyClusterLifecycle() {
  const stableCutoff = daysAgo(CLUSTER_STABLE_INACTIVE_DAYS);
  const lowImpactCutoff = daysAgo(CLUSTER_LOW_IMPACT_INACTIVE_DAYS);
  const mediumImpactCutoff = daysAgo(CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS);
  const highImpactCutoff = daysAgo(CLUSTER_HIGH_IMPACT_INACTIVE_DAYS);
  const criticalImpactCutoff = daysAgo(CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS);

  const [stableResult, lowResult, mediumResult, highResult, criticalResult] =
    await Promise.all([
      // STABLE or RESOLVING — deactivate after 7 days regardless of impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          status: { in: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(stableCutoff)],
        },
        data: { isActive: false },
      }),
      // LOW impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "LOW",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(lowImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // MEDIUM impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "MEDIUM",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(mediumImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // HIGH impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "HIGH",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(highImpactCutoff)],
        },
        data: { isActive: false },
      }),
      // CRITICAL impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "CRITICAL",
          status: { notIn: ["STABLE", "RESOLVING"] },
          AND: [inactiveByActivityCutoff(criticalImpactCutoff)],
        },
        data: { isActive: false },
      }),
    ]);

  const deactivatedCount =
    stableResult.count +
    lowResult.count +
    mediumResult.count +
    highResult.count +
    criticalResult.count;

  if (deactivatedCount > 0) {
    console.log(`🧹 Deactivated ${deactivatedCount} stale story clusters`);
  }
}

export async function saveClusteringResults(
  batch,
  activeClusters,
  activeClustersWithRefs,
  clusteringResponse,
) {
  let clusterData;
  try {
    clusterData = JSON.parse(
      clusteringResponse.content.replace(/```json|```/g, "").trim(),
    );
  } catch (err) {
    console.warn(`⚠️ Invalid JSON from clustering AI`);
    clusterData = { assignments: [], newClusters: [], clusterUpdates: [] };
  }

  const assignments = Array.isArray(clusterData.assignments)
    ? clusterData.assignments
    : [];
  const newClusters = Array.isArray(clusterData.newClusters)
    ? clusterData.newClusters
    : [];
  const clusterUpdates = Array.isArray(clusterData.clusterUpdates)
    ? clusterData.clusterUpdates
    : [];

  const activeClusterIds = new Set(activeClusters.map((c) => c.id));
  const activeClustersById = new Map(
    activeClusters.map((cluster) => [cluster.id, cluster]),
  );
  const clusterIdByRef = new Map(
    activeClustersWithRefs.map((cluster) => [cluster.aiRef, cluster.id]),
  );

  const articleIdByRef = new Map(
    batch.map((article, index) => [`article_${index + 1}`, article.id]),
  );

  const resolveArticleId = (refOrId) => articleIdByRef.get(refOrId) || refOrId;
  const resolveClusterId = (refOrId) =>
    clusterIdByRef.get(refOrId) ||
    (activeClusterIds.has(refOrId) ? refOrId : null);

  const clusterUpdatesById = new Map(
    clusterUpdates
      .filter((update) =>
        Boolean(
          resolveClusterId(
            cleanString(update?.clusterRef) || cleanString(update?.clusterId),
          ),
        ),
      )
      .map((update) => {
        const clusterId = resolveClusterId(
          cleanString(update.clusterRef) || cleanString(update.clusterId),
        );
        return [
          clusterId,
          buildClusterUpdateData(update, activeClustersById.get(clusterId)),
        ];
      }),
  );

  // Save new clusters
  for (const nc of newClusters) {
    try {
      const rawArticleRefs = Array.isArray(nc.articleRefs)
        ? nc.articleRefs
        : Array.isArray(nc.articleIds)
          ? nc.articleIds
          : [];
      const validArticleIds = rawArticleRefs
        .map((refOrId) => resolveArticleId(cleanString(refOrId)))
        .filter(Boolean);
      const uniqueArticleIds = [...new Set(validArticleIds)];

      if (uniqueArticleIds.length === 0) continue;

      // For the relationship, we need the rawArticleId
      const matchedBatchArticles = batch.filter((a) =>
        uniqueArticleIds.includes(a.id),
      );
      const clusterSignals = getArticleSignals(matchedBatchArticles);

      // Connect using rawArticleId for ProcessedArticle
      const articlesToConnect = matchedBatchArticles.map((article) => ({
        rawArticleId: article.rawArticleId,
      }));

      const cleanedNewCluster = buildClusterUpdateData(nc);
      if (!cleanedNewCluster.title || !cleanedNewCluster.summary) {
        console.warn("⚠️ Skipping new cluster with missing title or summary");
        continue;
      }

      const slug = generateSlug(cleanedNewCluster.title);

      const newCluster = await prisma.storyCluster.create({
        data: {
          slug: slug,
          title: cleanedNewCluster.title || nc.title,
          summary: cleanedNewCluster.summary || nc.summary,
          timeWindow: cleanedNewCluster.timeWindow || "Just Started",
          impact: cleanedNewCluster.impact || null,
          status: cleanedNewCluster.status || "EMERGING",
          momentumScore: 10,
          whyItMatters: cleanedNewCluster.whyItMatters || null,
          regions: cleanedNewCluster.regions || [],
          themes: cleanedNewCluster.themes || [],
          keyDevelopments: cleanedNewCluster.keyDevelopments || [],
          lastActivityAt: new Date(),
          articleCount: clusterSignals.articleCount,
          sourceCount: clusterSignals.sourceCount,
          topSources: clusterSignals.topSources,
          articles: { connect: articlesToConnect },
        },
        include: { articles: true },
      });
      console.log(`+ Created new cluster: "${nc.title}"`);

      await prisma.processedArticle.updateMany({
        where: { id: { in: matchedBatchArticles.map((a) => a.id) } },
        data: { clusterStatus: "CLUSTERED", clusteredAt: new Date() },
      });

      // Unshift so the next chunk in the loop has access to this new cluster!
      activeClusters.unshift(newCluster);
    } catch (err) {
      console.error(
        `⚠️ Failed to create new cluster: ${nc.title}`,
        err.message,
      );
    }
  }

  // Update existing cluster assignments
  const assignedClusterIdsToRefresh = new Set();

  for (const assignment of assignments) {
    const articleRef =
      cleanString(assignment.articleRef) || cleanString(assignment.articleId);
    const clusterRef =
      cleanString(assignment.clusterRef) || cleanString(assignment.clusterId);
    if (!articleRef || !clusterRef) continue;

    const articleId = resolveArticleId(articleRef);
    const clusterId = resolveClusterId(clusterRef);
    const confidence = cleanNumber(assignment.confidence);

    if (!articleId || !clusterId) continue;
    if (
      confidence !== undefined &&
      confidence < CLUSTER_ASSIGNMENT_MIN_CONFIDENCE
    )
      continue;

    try {
      const matchedArticle = batch.find((a) => a.id === articleId);
      if (matchedArticle) {
        await prisma.processedArticle.update({
          where: { rawArticleId: matchedArticle.rawArticleId },
          data: {
            storyClusters: { connect: { id: clusterId } },
            clusterStatus: "CLUSTERED",
            clusteredAt: new Date(),
          },
        });
        assignedClusterIdsToRefresh.add(clusterId);
      }
    } catch (err) {
      console.error(
        `⚠️ Failed to assign article ${articleRef} to cluster ${clusterRef}`,
        err.message,
      );
    }
  }

  // Refresh metadata and momentum for updated clusters
  for (const clusterId of assignedClusterIdsToRefresh) {
    try {
      const clusterUpdate = clusterUpdatesById.get(clusterId) || {};
      const existingCluster = activeClustersById.get(clusterId);

      const newArticleIdsAssignedToThisCluster = assignments
        .filter(
          (a) =>
            resolveClusterId(
              cleanString(a.clusterRef) || cleanString(a.clusterId),
            ) === clusterId,
        )
        .map((a) =>
          resolveArticleId(
            cleanString(a.articleRef) || cleanString(a.articleId),
          ),
        );

      const newArticlesAssignedToThisCluster = batch.filter((article) =>
        newArticleIdsAssignedToThisCluster.includes(article.id),
      );
      const combinedArticles = [
        ...(existingCluster?.articles || []),
        ...newArticlesAssignedToThisCluster,
      ];
      const clusterSignals = getArticleSignals(combinedArticles);

      const updatedCluster = await prisma.storyCluster.update({
        where: { id: clusterId },
        data: {
          ...clusterUpdate,
          ...clusterSignals,
          momentumScore: {
            increment: newArticlesAssignedToThisCluster.length * 5,
          }, // Boost momentum for new articles
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
      ...newClusters.flatMap((nc) =>
        (Array.isArray(nc.articleRefs)
          ? nc.articleRefs
          : Array.isArray(nc.articleIds)
            ? nc.articleIds
            : []
        ).map((ref) => resolveArticleId(cleanString(ref))),
      ),
      ...assignments.map((a) =>
        resolveArticleId(cleanString(a.articleRef) || cleanString(a.articleId)),
      ),
    ].filter(Boolean),
  );

  const unassignedArticleIds = batch
    .map((a) => a.id)
    .filter((id) => !assignedArticleIds.has(id));

  if (unassignedArticleIds.length > 0) {
    await prisma.processedArticle.updateMany({
      where: { id: { in: unassignedArticleIds } },
      data: {
        clusterStatus: "ARCHIVED_UNCLUSTERED",
        clusteredAt: new Date(),
      },
    });
  }

  // Log AI Usage
  await logAiUsage(
    clusteringResponse.provider,
    clusteringResponse.model,
    clusteringResponse.tokensUsed,
    0.0006,
  );
}
