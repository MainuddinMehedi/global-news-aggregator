const ALLOWED_IMPACTS = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const ALLOWED_STATUSES = new Set([
  "EMERGING",
  "ESCALATING",
  "DEVELOPING",
  "SLOW_BURN",
  "STABLE",
  "RESOLVING",
  "ARCHIVED",
]);

const ENTITY_ALIASES = new Map([
  ["u.s.", "united states"],
  ["us", "united states"],
  ["usa", "united states"],
  ["u.s.a.", "united states"],
  ["america", "united states"],
  ["uk", "united kingdom"],
  ["u.k.", "united kingdom"],
  ["britain", "united kingdom"],
  ["eu", "european union"],
  ["u.n.", "united nations"],
  ["un", "united nations"],
]);

const ENTITY_TITLE_PREFIXES = [
  "president",
  "prime minister",
  "foreign minister",
  "defense minister",
  "defence minister",
  "secretary of state",
  "king",
  "queen",
  "prince",
  "princess",
  "dr",
  "mr",
  "mrs",
  "ms",
];

export function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function cleanStringArray(value, limit = 12) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

  return cleaned.slice(0, limit);
}

export function getCategoryNames(categories) {
  if (!Array.isArray(categories)) return [];

  return categories
    .map((category) =>
      typeof category === "string" ? category : cleanString(category?.name),
    )
    .filter(Boolean);
}

export function normalizeEntity(entity) {
  const original = cleanString(entity);
  if (!original) return undefined;

  let normalized = original
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = ENTITY_ALIASES.get(normalized) || normalized;

  for (const prefix of ENTITY_TITLE_PREFIXES) {
    if (normalized.startsWith(`${prefix} `)) {
      normalized = normalized.slice(prefix.length + 1).trim();
      break;
    }
  }

  normalized = normalized.replace(/\s+/g, " ").trim();
  return ENTITY_ALIASES.get(normalized) || normalized || undefined;
}

export function normalizedEntitySet(entities) {
  return new Set(
    (Array.isArray(entities) ? entities : [])
      .map(normalizeEntity)
      .filter(Boolean),
  );
}

function normalizedStringSet(values) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => cleanString(value)?.toLowerCase())
      .filter(Boolean),
  );
}

function tokenSet(value) {
  const text = cleanString(value);
  if (!text) return new Set();

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  );
}

function intersectionSize(setA, setB) {
  let count = 0;
  for (const value of setA) {
    if (setB.has(value)) count += 1;
  }
  return count;
}

export function cleanKeyDevelopments(value, limit = 10) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const title = cleanString(item.title);
      if (!title) return null;

      const development = { title };
      const date = cleanString(item.date);
      const description = cleanString(item.description);

      if (date) development.date = date;
      if (description) development.description = description;

      return development;
    })
    .filter(Boolean);

  return cleaned.slice(0, limit);
}

export function mergeStringArrays(existing, incoming, limit = 12) {
  return [
    ...new Set([...(existing || []), ...(incoming || [])].filter(Boolean)),
  ].slice(0, limit);
}

export function mergeKeyDevelopments(existing, incoming, limit = 10) {
  const merged = [];
  const seen = new Set();

  for (const development of [
    ...(cleanKeyDevelopments(existing, limit) || []),
    ...(incoming || []),
  ]) {
    const key = `${development.title}|${development.date || ""}`.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(development);
  }

  return merged.slice(-limit);
}

export function buildClusterUpdateData(clusterUpdate, existingCluster) {
  const data = {};

  const title = cleanString(clusterUpdate.title);
  const summary = cleanString(clusterUpdate.summary);
  const timeWindow = cleanString(clusterUpdate.timeWindow);
  const impact = cleanString(clusterUpdate.impact);
  const status = cleanString(clusterUpdate.status);
  const whyItMatters = cleanString(clusterUpdate.whyItMatters);
  const regions = cleanStringArray(clusterUpdate.regions);
  const themes = cleanStringArray(clusterUpdate.themes);
  const keyDevelopments = cleanKeyDevelopments(clusterUpdate.keyDevelopments);

  if (title) data.title = title;
  if (summary) data.summary = summary;
  if (timeWindow) data.timeWindow = timeWindow;
  if (impact && ALLOWED_IMPACTS.has(impact)) data.impact = impact;
  if (status && ALLOWED_STATUSES.has(status)) data.status = status;
  if (whyItMatters) data.whyItMatters = whyItMatters;
  if (regions) {
    data.regions = mergeStringArrays(existingCluster?.regions, regions);
  }
  if (themes) {
    data.themes = mergeStringArrays(existingCluster?.themes, themes);
  }
  if (keyDevelopments) {
    data.keyDevelopments = mergeKeyDevelopments(
      existingCluster?.keyDevelopments,
      keyDevelopments,
    );
  }

  return data;
}

export function clusterRankScore(cluster) {
  const impactScore =
    {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    }[cluster.impact] ?? 0;
  const activityAt = new Date(
    cluster.lastActivityAt || cluster.updatedAt || cluster.createdAt,
  ).getTime();
  const ageHours = Math.max(0, (Date.now() - activityAt) / (60 * 60 * 1000));
  const recencyScore = Math.max(0, 72 - ageHours) / 72;
  const articleScore = Math.min(cluster.articleCount || 0, 20) / 20;
  const sourceScore = Math.min(cluster.sourceCount || 0, 8) / 8;
  const momentumScore = Math.min(Math.max(cluster.momentumScore || 0, 0), 50) / 50;

  return (
    impactScore * 4 +
    recencyScore * 3 +
    articleScore +
    sourceScore +
    momentumScore
  );
}

export function selectClusterCandidates(clusters, limit = 30) {
  return [...clusters]
    .sort((a, b) => clusterRankScore(b) - clusterRankScore(a))
    .slice(0, limit);
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
