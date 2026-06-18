import { prisma } from "../db/prisma.js";

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
