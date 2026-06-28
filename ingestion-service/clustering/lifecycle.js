import { prisma } from "../db/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
export const CLUSTER_STABLE_LOW_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_LOW_DAYS || "7",
  10,
);
export const CLUSTER_STABLE_MEDIUM_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_MEDIUM_DAYS || "14",
  10,
);
export const CLUSTER_STABLE_HIGH_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_HIGH_DAYS || "21",
  10,
);
export const CLUSTER_STABLE_CRITICAL_DAYS = Number.parseInt(
  process.env.CLUSTER_STABLE_CRITICAL_DAYS || "30",
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
  const stableLowCutoff = daysAgo(CLUSTER_STABLE_LOW_DAYS);
  const stableMediumCutoff = daysAgo(CLUSTER_STABLE_MEDIUM_DAYS);
  const stableHighCutoff = daysAgo(CLUSTER_STABLE_HIGH_DAYS);
  const stableCriticalCutoff = daysAgo(CLUSTER_STABLE_CRITICAL_DAYS);

  const activeLowCutoff = daysAgo(CLUSTER_LOW_IMPACT_INACTIVE_DAYS);
  const activeMediumCutoff = daysAgo(CLUSTER_MEDIUM_IMPACT_INACTIVE_DAYS);
  const activeHighCutoff = daysAgo(CLUSTER_HIGH_IMPACT_INACTIVE_DAYS);
  const activeCriticalCutoff = daysAgo(CLUSTER_CRITICAL_IMPACT_INACTIVE_DAYS);

  const [lowResult, mediumResult, highResult, criticalResult, fallbackResult] =
    await Promise.all([
      // LOW impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "LOW",
          OR: [
            {
              status: { in: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(stableLowCutoff)],
            },
            {
              status: { notIn: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(activeLowCutoff)],
            },
          ],
        },
        data: { isActive: false },
      }),
      // MEDIUM impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "MEDIUM",
          OR: [
            {
              status: { in: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(stableMediumCutoff)],
            },
            {
              status: { notIn: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(activeMediumCutoff)],
            },
          ],
        },
        data: { isActive: false },
      }),
      // HIGH impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "HIGH",
          OR: [
            {
              status: { in: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(stableHighCutoff)],
            },
            {
              status: { notIn: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(activeHighCutoff)],
            },
          ],
        },
        data: { isActive: false },
      }),
      // CRITICAL impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: "CRITICAL",
          OR: [
            {
              status: { in: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(stableCriticalCutoff)],
            },
            {
              status: { notIn: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(activeCriticalCutoff)],
            },
          ],
        },
        data: { isActive: false },
      }),
      // Fallback for null/unspecified impact
      prisma.storyCluster.updateMany({
        where: {
          isActive: true,
          impact: null,
          OR: [
            {
              status: { in: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(stableLowCutoff)],
            },
            {
              status: { notIn: ["STABLE", "RESOLVING"] },
              AND: [inactiveByActivityCutoff(activeLowCutoff)],
            },
          ],
        },
        data: { isActive: false },
      }),
    ]);

  const deactivatedCount =
    lowResult.count +
    mediumResult.count +
    highResult.count +
    criticalResult.count +
    fallbackResult.count;

  if (deactivatedCount > 0) {
    console.log(`🧹 Deactivated ${deactivatedCount} stale story clusters`);
  }
}
