import { cleanString } from "./clean.js";
import { getCategoryNames } from "./clean.js";
import { normalizedEntitySet, normalizedStringSet, tokenSet, intersectionSize } from "./entity.js";
import { clusterRankScore } from "./cluster.js";
import { prisma } from "../../db/prisma.js";


function getArticleText(article) {
  return [
    article.rawArticle?.title || article.title,
    article.rawArticle?.contentSnippet || article.contentSnippet,
  ]
    .filter(Boolean)
    .join(" ");
}

function getArticlePublishedAt(article) {
  return article.rawArticle?.publishedAt || article.publishedAt;
}

function getArticleGroupSignals(articles) {
  const entities = new Set();
  const regions = new Set();
  const categories = new Set();
  const textTokens = new Set();
  let newestPublishedAt = 0;

  for (const article of articles) {
    for (const entity of normalizedEntitySet(article.entities)) {
      entities.add(entity);
    }

    const region = cleanString(article.eventRegion);
    if (region) regions.add(region.toLowerCase());

    for (const category of getCategoryNames(article.categories)) {
      categories.add(category.toLowerCase());
    }

    for (const token of tokenSet(getArticleText(article))) {
      textTokens.add(token);
    }

    const publishedAt = new Date(getArticlePublishedAt(article) || 0).getTime();
    if (Number.isFinite(publishedAt)) {
      newestPublishedAt = Math.max(newestPublishedAt, publishedAt);
    }
  }

  return { entities, regions, categories, textTokens, newestPublishedAt };
}

function getClusterSignals(cluster) {
  const entities = new Set();
  const categories = new Set();

  for (const article of cluster.articles || []) {
    for (const entity of normalizedEntitySet(article.entities)) {
      entities.add(entity);
    }
    for (const category of getCategoryNames(article.categories)) {
      categories.add(category.toLowerCase());
    }
  }

  const regions = normalizedStringSet(cluster.regions);
  const themes = normalizedStringSet(cluster.themes);
  const textTokens = tokenSet(`${cluster.title || ""} ${cluster.summary || ""}`);
  const lastActivityAt = new Date(
    cluster.lastActivityAt || cluster.updatedAt || cluster.createdAt || 0,
  ).getTime();

  return { entities, categories, regions, themes, textTokens, lastActivityAt };
}

export function clusterRelevanceScore(articles, cluster) {
  const articleSignals = getArticleGroupSignals(articles);
  const clusterSignals = getClusterSignals(cluster);

  const entityOverlap = intersectionSize(
    articleSignals.entities,
    clusterSignals.entities,
  );
  const regionOverlap = intersectionSize(
    articleSignals.regions,
    clusterSignals.regions,
  );
  const categoryThemeOverlap =
    intersectionSize(articleSignals.categories, clusterSignals.themes) +
    intersectionSize(articleSignals.categories, clusterSignals.categories);
  const textOverlap = intersectionSize(
    articleSignals.textTokens,
    clusterSignals.textTokens,
  );

  const newestArticleTime = articleSignals.newestPublishedAt || Date.now();
  const activityTime = clusterSignals.lastActivityAt || Date.now();
  const gapHours = Math.abs(newestArticleTime - activityTime) / (60 * 60 * 1000);
  const recencyCompatibility = Math.max(0, 1 - gapHours / (45 * 24));

  return (
    entityOverlap * 8 +
    regionOverlap * 3 +
    categoryThemeOverlap * 2 +
    Math.min(textOverlap, 8) * 0.5 +
    recencyCompatibility * 2 +
    clusterRankScore(cluster) * 0.25
  );
}

export async function selectRelevantClusterCandidates(articles, limit = 30) {
  const threshold = Number.parseFloat(process.env.CLUSTER_FAST_EXIT_THRESHOLD || "0.38");
  const minLegacyScore = Number.parseFloat(process.env.CLUSTER_LEGACY_MIN_SCORE || "10.0");
  const poolLimit = Number.parseInt(process.env.CLUSTER_CANDIDATE_POOL_LIMIT || "200", 10);

  const articleIds = articles.map((a) => a.id).filter(Boolean);

  if (articleIds.length === 0) {
    return {
      candidates: [],
      isFastExit: true,
      minDistance: null,
    };
  }

  // 1. Fetch nearest active clusters via SQL vector distance query
  const rawVectorCandidates = await prisma.$queryRaw`
    SELECT c.id, MIN(p.embedding <=> a.embedding) AS min_distance
    FROM "StoryCluster" c
    JOIN "_ArticleStoryClusters" sc_art ON c.id = sc_art."B"
    JOIN "ProcessedArticle" p ON sc_art."A" = p.id
    JOIN "ProcessedArticle" a ON a.id = ANY(${articleIds})
    WHERE c."isActive" = true
      AND p.embedding IS NOT NULL
    GROUP BY c.id
    ORDER BY min_distance ASC
    LIMIT ${limit};
  `;

  // 2. Fetch active clusters and filter for legacy ones (NO articles containing embeddings) in JS
  const activeClustersPool = await prisma.storyCluster.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
    take: poolLimit,
    include: {
      articles: {
        orderBy: { processedAt: "desc" },
        take: 5,
        include: { rawArticle: true, categories: true },
      },
    },
  });

  const legacyClusters = activeClustersPool.filter((cluster) =>
    cluster.articles.length > 0 && cluster.articles.every((art) => !art.embedding)
  );

  // Calculate relevance scores for legacy active clusters in-memory
  const legacyCandidates = legacyClusters
    .map((cluster) => ({
      cluster,
      relevanceScore: clusterRelevanceScore(articles, cluster),
    }))
    .filter((c) => c.relevanceScore >= minLegacyScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 3. Retrieve the full active cluster data for the vector candidate IDs
  let vectorClusters = [];
  if (rawVectorCandidates.length > 0) {
    const vectorClusterIds = rawVectorCandidates.map((vc) => vc.id);
    const fetchedClusters = await prisma.storyCluster.findMany({
      where: { id: { in: vectorClusterIds } },
      include: {
        articles: {
          orderBy: { processedAt: "desc" },
          take: 5,
          include: { rawArticle: true, categories: true },
        },
      },
    });

    // Re-map back to preserve the minimum distance ordering from raw SQL
    vectorClusters = rawVectorCandidates
      .map((vc) => {
        const cluster = fetchedClusters.find((c) => c.id === vc.id);
        return cluster ? { cluster, minDistance: Number(vc.min_distance) } : null;
      })
      .filter(Boolean);
  }

  // 4. Evaluate Fast-Exit
  const closestDistance = vectorClusters[0]?.minDistance;
  const topLegacyScore = legacyCandidates[0]?.relevanceScore || 0;

  const isFastExit =
    (closestDistance === undefined || closestDistance > threshold) &&
    topLegacyScore < minLegacyScore;

  if (isFastExit) {
    console.log(
      `⚡ Fast-exit triggered: no candidate clusters within threshold (closest distance: ${closestDistance !== undefined ? closestDistance.toFixed(4) : "N/A"} > ${threshold}, top legacy score: ${topLegacyScore.toFixed(2)} < ${minLegacyScore})`
    );
    return {
      candidates: [],
      isFastExit: true,
      minDistance: closestDistance,
    };
  }

  // 5. Merge vector-based and legacy candidates
  const combined = [];
  for (const vc of vectorClusters) {
    combined.push({
      cluster: vc.cluster,
      score: 1.0 - vc.minDistance,
    });
  }
  for (const lc of legacyCandidates) {
    combined.push({
      cluster: lc.cluster,
      score: Math.min(0.9, lc.relevanceScore / 50.0),
    });
  }

  const finalCandidates = combined
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.cluster);

  return {
    candidates: finalCandidates,
    isFastExit: false,
    minDistance: closestDistance,
  };
}

