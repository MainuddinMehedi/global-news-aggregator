import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { getPublisherRegion } from "@/utils/analytics";

export interface GlobalAnalyticsData {
  eventRegionDistribution: {
    label: string;
    count: number;
    color: string;
    percentage: number;
  }[];
  topSourceCountries: {
    country: string;
    count: number;
    percentage: number;
  }[];
  categoryBreakdown: {
    name: string;
    count: number;
    percentage: number;
  }[];
  sentimentDistribution: {
    label: string;
    count: number;
    range: [number, number];
  }[];
  totalArticles: number;
  totalStories: number;
  avgSentiment: number | null;
  topEntities: { entity: string; count: number }[];
  biasGroupDistribution: {
    label: string;
    count: number;
    percentage: number;
  }[];
  coverageScopeDistribution: {
    label: string;
    count: number;
    percentage: number;
  }[];
}

export interface UserAnalyticsData {
  totalFindings: number;
  totalTopics: number;
  topicSourceDistribution: {
    source: string;
    count: number;
    percentage: number;
  }[];
}

function getStartDate(timeRange: string): Date {
  let startDate = new Date(0);

  if (timeRange === "24h") {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (timeRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  return startDate;
}

export async function getGlobalAnalyticsData(
  timeRange: string = "7d",
): Promise<GlobalAnalyticsData> {
  "use cache";
  cacheTag(`analytics-global-${timeRange}`);
  cacheTag("articles");
  cacheTag("stories");
  cacheLife("minutes");

  const startDate = getStartDate(timeRange);

  try {
    const [processedArticles, storyClusters, categories] = await Promise.all([
      prisma.processedArticle.findMany({
        where: {
          processedAt: { gte: startDate },
          clusterStatus: { not: "SKIPPED" },
        },
        select: {
          eventRegion: true,
          sentimentScore: true,
          entities: true,
          rawArticle: {
            select: {
              sourceCountry: true,
              biasGroup: true,
              coverageScope: true,
            },
          },
        },
      }),
      prisma.storyCluster.count({
        where: { isActive: true, createdAt: { gte: startDate } },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: {
                  processedAt: { gte: startDate },
                  clusterStatus: { not: "SKIPPED" },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalArticles = processedArticles.length;

    // ── Event Region Distribution ──────────────────────────────────────────────
    const regionCounts: Record<string, number> = {
      "North America": 0,
      Europe: 0,
      "Middle East": 0,
      "Asia-Pacific": 0,
      "South America": 0,
      Africa: 0,
      Global: 0,
      Unknown: 0,
    };

    for (const a of processedArticles) {
      const reg = a.eventRegion;

      if (!reg) regionCounts["Unknown"]++;
      else if (regionCounts[reg] !== undefined) regionCounts[reg]++;
      else regionCounts["Unknown"]++;
    }

    const regionColors: Record<string, string> = {
      "North America": "#3b82f6",
      Europe: "#10b981",
      "Middle East": "#ef4444",
      "Asia-Pacific": "#f59e0b",
      "South America": "#8b5cf6",
      Africa: "#ec4899",
      Global: "#6b7280",
      Unknown: "#9ca3af",
    };

    const eventRegionDistribution = Object.entries(regionCounts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        color: regionColors[label] ?? "#9ca3af",
        percentage:
          totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Top Source Countries ───────────────────────────────────────────────────
    const countryCounts: Record<string, number> = {};

    for (const a of processedArticles) {
      const c = a.rawArticle?.sourceCountry ?? "Unknown";
      countryCounts[c] = (countryCounts[c] ?? 0) + 1;
    }

    const topSourceCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([country, count]) => ({
        country,
        count,
        percentage:
          totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }));

    // ── Category Breakdown ─────────────────────────────────────────────────────
    const totalCategoryArticles = categories.reduce(
      (s, c) => s + c._count.articles,
      0,
    );
    const categoryBreakdown = categories
      .map((c) => ({
        name: c.name,
        count: c._count.articles,
        percentage:
          totalCategoryArticles > 0
            ? Math.round((c._count.articles / totalCategoryArticles) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Sentiment Distribution ─────────────────────────────────────────────────
    const sentimentBuckets = [
      {
        label: "Very Negative",
        range: [-1, -0.6] as [number, number],
        count: 0,
      },
      { label: "Negative", range: [-0.6, -0.2] as [number, number], count: 0 },
      { label: "Neutral", range: [-0.2, 0.2] as [number, number], count: 0 },
      { label: "Positive", range: [0.2, 0.6] as [number, number], count: 0 },
      { label: "Very Positive", range: [0.6, 1] as [number, number], count: 0 },
    ];

    let sentimentSum = 0;
    let sentimentCount = 0;

    for (const a of processedArticles) {
      if (a.sentimentScore != null) {
        sentimentSum += a.sentimentScore;
        sentimentCount++;
        for (const bucket of sentimentBuckets) {
          if (
            a.sentimentScore >= bucket.range[0] &&
            a.sentimentScore < bucket.range[1]
          ) {
            bucket.count++;
            break;
          }
        }
      }
    }

    // ── Top Entities ──────────────────────────────────────────────────────────
    const entityCounts: Record<string, number> = {};

    for (const a of processedArticles) {
      for (const e of a.entities ?? []) {
        if (e && e.length > 1) {
          entityCounts[e] = (entityCounts[e] ?? 0) + 1;
        }
      }
    }

    const topEntities = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([entity, count]) => ({ entity, count }));

    // ── Bias Group Distribution ──────────────────────────────────────────────
    const biasCounts: Record<string, number> = {};

    for (const a of processedArticles) {
      const bias = a.rawArticle?.biasGroup ?? "Unknown";
      biasCounts[bias] = (biasCounts[bias] ?? 0) + 1;
    }

    const biasGroupDistribution = Object.entries(biasCounts)
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Coverage Scope Distribution ──────────────────────────────────────────
    const scopeCounts: Record<string, number> = {};

    for (const a of processedArticles) {
      const scope = a.rawArticle?.coverageScope ?? "Unknown";
      scopeCounts[scope] = (scopeCounts[scope] ?? 0) + 1;
    }

    const coverageScopeDistribution = Object.entries(scopeCounts)
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      eventRegionDistribution,
      topSourceCountries,
      categoryBreakdown,
      sentimentDistribution: sentimentBuckets,
      totalArticles,
      totalStories: storyClusters,
      avgSentiment: sentimentCount > 0 ? sentimentSum / sentimentCount : null,
      topEntities,
      biasGroupDistribution,
      coverageScopeDistribution,
    };
  } catch (error) {
    console.error("getGlobalAnalyticsData error:", error);

    return {
      eventRegionDistribution: [],
      topSourceCountries: [],
      categoryBreakdown: [],
      sentimentDistribution: [],
      totalArticles: 0,
      totalStories: 0,
      avgSentiment: null,
      topEntities: [],
      biasGroupDistribution: [],
      coverageScopeDistribution: [],
    };
  }
}

export async function getUserAnalyticsData(
  userId: string,
  timeRange: string = "7d",
): Promise<UserAnalyticsData> {
  "use cache";
  cacheTag(`analytics-user-${userId}-${timeRange}`);
  cacheTag(`locked-topics`); // Ideally, we'd tag by user id, but using broad tags for now
  cacheLife("minutes");

  const startDate = getStartDate(timeRange);

  try {
    const [topicFindings, lockedTopics, topicSources] = await Promise.all([
      prisma.topicFinding.count({
        where: {
          foundAt: { gte: startDate },
          topic: { userId: userId },
        },
      }),
      prisma.lockedTopic.count({
        where: {
          createdAt: { gte: startDate },
          userId: userId,
        },
      }),
      prisma.topicFinding.groupBy({
        by: ["sourceType"],
        _count: { _all: true },
        where: {
          foundAt: { gte: startDate },
          topic: { userId: userId },
        },
      }),
    ]);

    // ── Topic Source Distribution ─────────────────────────────────────────────
    const totalTopicSources = topicSources.reduce(
      (s, t) => s + t._count._all,
      0,
    );

    const topicSourceDistribution = topicSources
      .map((t) => ({
        source: t.sourceType,
        count: t._count._all,
        percentage:
          totalTopicSources > 0
            ? Math.round((t._count._all / totalTopicSources) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalFindings: topicFindings,
      totalTopics: lockedTopics,
      topicSourceDistribution,
    };
  } catch (error) {
    console.error("getUserAnalyticsData error:", error);

    return {
      totalFindings: 0,
      totalTopics: 0,
      topicSourceDistribution: [],
    };
  }
}

// ── Backwards compatibility for sidebar widgets ──────────────────────────────

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

export async function getContentInsights() {
  "use cache";
  cacheTag("articles");
  cacheLife("hours");

  try {
    const [regionStats, categoryStats, sentimentStats] = await Promise.all([
      prisma.processedArticle.groupBy({
        by: ["eventRegion"],
        _count: { _all: true },
        where: { clusterStatus: { not: "SKIPPED" } },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: { clusterStatus: { not: "SKIPPED" } },
              },
            },
          },
        },
      }),
      prisma.processedArticle.aggregate({
        _avg: { sentimentScore: true },
        _count: { sentimentScore: true },
        where: { clusterStatus: { not: "SKIPPED" } },
      }),
    ]);

    return {
      eventRegionDistribution: regionStats.map((b) => ({
        label: b.eventRegion || "Unknown",
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

export async function getSourceOriginCounts() {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const rawCounts = await prisma.rawArticle.groupBy({
      by: ["sourceCountry"],
      _count: { _all: true },
      where: {
        processedArticle: {
          is: {
            clusterStatus: { not: "SKIPPED" },
          },
        },
      },
    });

    const all = rawCounts.reduce(
      (acc, curr) => acc + (curr._count?._all ?? 0),
      0,
    );

    const counts = rawCounts.reduce(
      (acc, curr) => {
        const origin = getPublisherRegion(curr.sourceCountry);
        acc[origin] = (acc[origin] ?? 0) + (curr._count?._all ?? 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      all,
      counts,
    };
  } catch (error) {
    console.error("getSourceOriginCounts error:", error);
    return { all: 0, counts: {} };
  }
}

export async function getBiasGroupCounts() {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const rawCounts = await prisma.rawArticle.groupBy({
      by: ["biasGroup"],
      _count: { _all: true },
      where: {
        processedArticle: {
          is: {
            clusterStatus: { not: "SKIPPED" },
          },
        },
      },
    });

    const all = rawCounts.reduce((acc, curr) => acc + curr._count._all, 0);

    const counts = rawCounts.reduce(
      (acc, curr) => {
        const bias = curr.biasGroup || "Unknown";
        acc[bias] = curr._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      all,
      counts,
    };
  } catch (error) {
    console.error("getBiasGroupCounts error:", error);
    return { all: 0, counts: {} };
  }
}

export async function getStoryClustersWithOrigins() {
  "use cache";
  cacheTag("stories");
  cacheTag("articles");
  cacheLife("minutes");

  try {
    const clusters = await prisma.storyCluster.findMany({
      where: { isActive: true },
      orderBy: { articleCount: "desc" },
      take: 5,
      include: {
        articles: {
          include: {
            rawArticle: {
              select: {
                sourceCountry: true,
              },
            },
          },
        },
      },
    });

    return clusters.map((c) => {
      const uniqueOrigins = Array.from(
        new Set(
          c.articles
            .map((a) => getPublisherRegion(a.rawArticle.sourceCountry))
            .filter((p): p is string => !!p),
        ),
      );

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        articleCount: c.articleCount,
        impact: c.impact,
        topSources: c.topSources,
        origins: uniqueOrigins,
      };
    });
  } catch (error) {
    console.error("getStoryClustersWithOrigins error:", error);
    return [];
  }
}
