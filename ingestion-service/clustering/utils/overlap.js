import { cleanString } from "./clean.js";
import { normalizedEntitySet, intersectionSize } from "./entity.js";

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

export function detectEntityOverlap(holdingArticles) {
  const minEntityOverlap = Number.parseInt(
    process.env.CLUSTER_MIN_ENTITY_OVERLAP || "2",
    10,
  );
  const minGroupSize = Number.parseInt(
    process.env.CLUSTER_MIN_GROUP_SIZE || "3",
    10,
  );
  const eligibleArticles = holdingArticles.filter(
    (article) => normalizedEntitySet(article.entities).size > 0,
  );
  const entitySetsById = new Map(
    eligibleArticles.map((article) => [
      article.id,
      normalizedEntitySet(article.entities),
    ]),
  );
  const adjacency = new Map(
    eligibleArticles.map((article) => [article.id, new Set()]),
  );

  for (let i = 0; i < eligibleArticles.length; i++) {
    const article = eligibleArticles[i];
    const articleEntities = entitySetsById.get(article.id);

    for (let j = i + 1; j < eligibleArticles.length; j++) {
      const otherArticle = eligibleArticles[j];
      const otherEntities = entitySetsById.get(otherArticle.id);

      if (intersectionSize(articleEntities, otherEntities) >= minEntityOverlap) {
        adjacency.get(article.id).add(otherArticle.id);
        adjacency.get(otherArticle.id).add(article.id);
      }
    }
  }

  const articlesById = new Map(eligibleArticles.map((article) => [article.id, article]));
  const visited = new Set();
  const groups = [];

  for (const article of eligibleArticles) {
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
