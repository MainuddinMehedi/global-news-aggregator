import { prisma } from "../db/prisma.js";

const ALLOWED_IMPACTS = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const ALLOWED_STATUSES = new Set([
  "ESCALATING",
  "DEVELOPING",
  "STABLE",
  "RESOLVING",
]);
const DAY_MS = 24 * 60 * 60 * 1000;
const CLUSTER_STABLE_INACTIVE_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_INACTIVE_DAYS || "7",
  10,
);
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

export function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function cleanStringArray(value, limit = 12) {
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

function cleanKeyDevelopments(value, limit = 10) {
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

function mergeStringArrays(existing, incoming, limit = 12) {
  return [
    ...new Set([...(existing || []), ...(incoming || [])].filter(Boolean)),
  ].slice(0, limit);
}

function mergeKeyDevelopments(existing, incoming, limit = 10) {
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

  return impactScore * 4 + recencyScore * 3 + articleScore + sourceScore;
}

export function selectClusterCandidates(clusters, limit = 30) {
  return [...clusters]
    .sort((a, b) => clusterRankScore(b) - clusterRankScore(a))
    .slice(0, limit);
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
