import { prisma } from "../db/prisma.js";
import { logAiUsage } from "../utils/logAiUsage.js";
import { generateSlug } from "../utils/generateSlug.js";
import {
  cleanNumber,
  cleanString,
  buildClusterUpdateData,
  getArticleSignals,
} from "./utils/index.js";

const CLUSTER_ASSIGNMENT_MIN_CONFIDENCE = Number.parseFloat(
  process.env.CLUSTER_ASSIGNMENT_MIN_CONFIDENCE || "0.55",
);

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
    console.warn("⚠️ Invalid JSON from clustering AI");
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

      const matchedBatchArticles = batch.filter((a) =>
        uniqueArticleIds.includes(a.id),
      );
      const clusterSignals = getArticleSignals(matchedBatchArticles);
      const articlesToConnect = matchedBatchArticles.map((article) => ({
        rawArticleId: article.rawArticleId,
      }));

      const cleanedNewCluster = buildClusterUpdateData(nc);
      if (!cleanedNewCluster.title || !cleanedNewCluster.summary) {
        console.warn("⚠️ Skipping new cluster with missing title or summary");
        continue;
      }

      const newCluster = await prisma.storyCluster.create({
        data: {
          slug: generateSlug(cleanedNewCluster.title),
          title: cleanedNewCluster.title,
          summary: cleanedNewCluster.summary,
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
      console.log(`+ Created new cluster: "${cleanedNewCluster.title}"`);

      await prisma.processedArticle.updateMany({
        where: { id: { in: matchedBatchArticles.map((a) => a.id) } },
        data: { clusterStatus: "CLUSTERED", clusteredAt: new Date() },
      });

      activeClusters.unshift(newCluster);
    } catch (err) {
      console.error(
        `⚠️ Failed to create new cluster: ${nc.title}`,
        err.message,
      );
    }
  }

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
    ) {
      continue;
    }

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
          },
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

  await logAiUsage(
    clusteringResponse.provider,
    clusteringResponse.model,
    clusteringResponse.tokensUsed,
    0.0006,
  );
}
