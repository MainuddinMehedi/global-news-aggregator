import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getAiUsageStats() {
  "use cache";
  cacheTag("ai-usage");
  cacheLife("hours");

  try {
    const today = new Date().toISOString().split("T")[0];
    const stats = await prisma.aiUsage.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
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
        where: { processedAt: { gte: sevenDaysAgo } },
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

export async function getContentInsights() {
  "use cache";
  cacheTag("articles");
  cacheLife("hours");

  try {
    const [biasStats, categoryStats, sentimentStats] = await Promise.all([
      prisma.processedArticle.groupBy({
        by: ["biasCategory"],
        _count: { _all: true },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { articles: true },
          },
        },
      }),
      prisma.processedArticle.aggregate({
        _avg: { sentimentScore: true },
        _count: { sentimentScore: true },
      }),
    ]);

    return {
      biasDistribution: biasStats.map((b) => ({
        label: b.biasCategory || "Unknown",
        count: b._count._all,
      })),
      categories: categoryStats.map((c) => ({
        label: c.name,
        count: c._count.articles,
      })),
      sentiment: {
        average: sentimentStats._avg.sentimentScore,
        count: sentimentStats._count.sentimentScore,
      },
    };
  } catch (error) {
    console.error("getContentInsights error:", error);
    return null;
  }
}

export async function getClusterStats() {
  "use cache";
  cacheTag("stories");
  cacheLife("minutes");

  try {
    const clusters = await prisma.storyCluster.groupBy({
      by: ["impact"],
      _count: { _all: true },
      where: { isActive: true },
    });

    const activeCount = await prisma.storyCluster.count({
      where: { isActive: true },
    });

    return {
      activeCount,
      impactDistribution: clusters.map((c) => ({
        label: c.impact || "MEDIUM",
        count: c._count._all,
      })),
    };
  } catch (error) {
    console.error("getClusterStats error:", error);
    return null;
  }
}
