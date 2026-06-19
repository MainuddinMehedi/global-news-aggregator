import { cleanString, cleanStringArray } from "./clean.js";
import { ALLOWED_IMPACTS, ALLOWED_STATUSES } from "./constants.js";
import { cleanKeyDevelopments, mergeStringArrays, mergeKeyDevelopments } from "./keyDevelopments.js";

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
