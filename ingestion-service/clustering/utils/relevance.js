import { cleanString } from "./clean.js";
import { getCategoryNames } from "./clean.js";
import { normalizedEntitySet, normalizedStringSet, tokenSet, intersectionSize } from "./entity.js";
import { clusterRankScore } from "./cluster.js";

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

    for (const token of tokenSet(
      `${article.title || ""} ${article.contentSnippet || ""}`,
    )) {
      textTokens.add(token);
    }

    const publishedAt = new Date(
      article.publishedAt || article.rawArticle?.publishedAt || 0,
    ).getTime();
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

export function selectRelevantClusterCandidates(articles, clusters, limit = 30) {
  return [...clusters]
    .map((cluster) => ({
      cluster,
      relevanceScore: clusterRelevanceScore(articles, cluster),
    }))
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return clusterRankScore(b.cluster) - clusterRankScore(a.cluster);
    })
    .slice(0, limit)
    .map(({ cluster }) => cluster);
}
