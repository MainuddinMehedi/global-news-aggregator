import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getAiUsageStats() {
  "use cache";
  cacheTag("ai-usage");
  cacheLife("hours");

  try {
    const stats = await prisma.aiUsage.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: "asc" },
    });

    const summary = stats.reduce(
      (acc, curr) => {
        acc.totalTokens += curr.tokensUsed;
        acc.totalCost += curr.estimatedCost;
        acc.successCount += curr.success ? 1 : 0;
        acc.failCount += curr.success ? 0 : 1;

        if (!acc.models[curr.model]) {
          acc.models[curr.model] = { tokens: 0, cost: 0 };
        }
        acc.models[curr.model].tokens += curr.tokensUsed;
        acc.models[curr.model].cost += curr.estimatedCost;

        return acc;
      },
      {
        totalTokens: 0,
        totalCost: 0,
        successCount: 0,
        failCount: 0,
        models: {} as Record<string, { tokens: number; cost: number }>,
      },
    );

    return summary;
  } catch (error) {
    console.error("getAiUsageStats error:", error);
    return null;
  }
}

export async function getIngestionStats() {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [rawCount, processedCount, sources] = await Promise.all([
      prisma.rawArticle.count({
        where: { fetchedAt: { gte: sevenDaysAgo } },
      }),
      prisma.processedArticle.count({
        where: {
          processedAt: { gte: sevenDaysAgo },
          clusterStatus: { not: "SKIPPED" },
        },
      }),
      prisma.rawArticle.groupBy({
        by: ["source"],
        _count: { _all: true },
        _max: { fetchedAt: true },
        where: { fetchedAt: { gte: sevenDaysAgo } },
      }),
    ]);

    return {
      rawCount,
      processedCount,
      dedupRate: rawCount > 0 ? (1 - processedCount / rawCount) * 100 : 0,
      sources: sources.map((s) => ({
        name: s.source,
        count: s._count._all,
        lastFetch: s._max.fetchedAt,
      })),
    };
  } catch (error) {
    console.error("getIngestionStats error:", error);
    return null;
  }
}
