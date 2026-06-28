import { cleanString } from "./clean.js";
import { normalizedEntitySet, intersectionSize } from "./entity.js";
import { prisma } from "../../db/prisma.js";


export function getArticleSignals(articles) {
  const sourceCounts = new Map();

  for (const article of articles) {
    const source = cleanString(article.source || article.rawArticle?.source);
    if (!source) continue;

    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }

  const topSources = [...sourceCounts.entries()]
    .sort(([sourceA, countA], [sourceB, countB]) => {
      if (countA !== countB) return countB - countA;
      return sourceA.localeCompare(sourceB);
    })
    .slice(0, 5)
    .map(([source]) => source);

  return {
    articleCount: articles.length,
    sourceCount: sourceCounts.size,
    topSources,
  };
}

export async function detectEntityOverlap(holdingArticles) {
  const minEntityOverlap = Number.parseInt(
    process.env.CLUSTER_MIN_ENTITY_OVERLAP || "2",
    10,
  );
  const minGroupSize = Number.parseInt(
    process.env.CLUSTER_MIN_GROUP_SIZE || "3",
    10,
  );
  const similarityThreshold = Number.parseFloat(
    process.env.CLUSTER_PRE_CLUSTERING_THRESHOLD || "0.25",
  );

  const holdingIds = holdingArticles.map((a) => a.id).filter(Boolean);
  if (holdingIds.length === 0) return [];

  // 1. Fetch vector-similar article pairs using raw SQL (HNSW optimized)
  const rawPairs = await prisma.$queryRaw`
    SELECT a1.id AS id1, a2.id AS id2
    FROM "ProcessedArticle" a1
    JOIN "ProcessedArticle" a2 ON a1.id < a2.id
    WHERE a1.id = ANY(${holdingIds})
      AND a2.id = ANY(${holdingIds})
      AND a1.embedding IS NOT NULL
      AND a2.embedding IS NOT NULL
      AND (a1.embedding <=> a2.embedding) < ${similarityThreshold};
  `;

  // 2. Build adjacency graph (initial nodes from all holding articles)
  const adjacency = new Map(holdingArticles.map((a) => [a.id, new Set()]));

  for (const pair of rawPairs) {
    adjacency.get(pair.id1).add(pair.id2);
    adjacency.get(pair.id2).add(pair.id1);
  }

  // 3. Fallback for legacy articles without embeddings (check entity overlap)
  const eligibleArticlesForEntities = holdingArticles.filter(
    (article) => !article.embedding && normalizedEntitySet(article.entities).size > 0,
  );
  const entitySetsById = new Map(
    holdingArticles.map((article) => [
      article.id,
      normalizedEntitySet(article.entities),
    ]),
  );

  for (let i = 0; i < eligibleArticlesForEntities.length; i++) {
    const article = eligibleArticlesForEntities[i];
    const articleEntities = entitySetsById.get(article.id);

    // Compare with all other holding articles
    for (const otherArticle of holdingArticles) {
      if (article.id === otherArticle.id) continue;
      const otherEntities = entitySetsById.get(otherArticle.id);

      if (intersectionSize(articleEntities, otherEntities) >= minEntityOverlap) {
        adjacency.get(article.id).add(otherArticle.id);
        adjacency.get(otherArticle.id).add(article.id);
      }
    }
  }

  // 4. Find connected components (DFS)
  const articlesById = new Map(holdingArticles.map((article) => [article.id, article]));
  const visited = new Set();
  const groups = [];

  for (const article of holdingArticles) {
    if (visited.has(article.id)) continue;

    const stack = [article.id];
    const component = [];
    visited.add(article.id);

    while (stack.length > 0) {
      const articleId = stack.pop();
      component.push(articlesById.get(articleId));

      for (const neighborId of adjacency.get(articleId) || []) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        stack.push(neighborId);
      }
    }

    if (component.length >= minGroupSize) {
      groups.push(component);
    }
  }

  return groups;
}

