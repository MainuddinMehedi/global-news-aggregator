import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { getPublisherRegion } from "@/lib/utils";

export interface AnalyticsData {
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
  totalFindings: number;
  totalTopics: number;
  avgSentiment: number | null;
  topEntities: { entity: string; count: number }[];
  aiUsageChart: {
    date: string;
    tokensUsed: number;
    estimatedCost: number;
  }[];
  sourceHealth: {
    name: string;
    count: number;
    lastFetch: Date;
    isStale: boolean;
  }[];
  ingestionVolumeChart: {
    date: string;
    raw: number;
    processed: number;
  }[];
  dedupRate: number;
  
  // New Analytics
  modelUtilization: { model: string; count: number; percentage: number }[];
  topicSourceDistribution: { source: string; count: number; percentage: number }[];
  storyImpactDistribution: { status: string; count: number }[];
  chatTelemetry: {
    totalSessions: number;
    totalMessages: number;
    totalToolRuns: number;
    activeModels: { model: string; count: number }[];
  };
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

export async function getAnalyticsData(timeRange: string = "7d"): Promise<AnalyticsData> {
  "use cache";
  cacheTag(`analytics-${timeRange}`);
  cacheTag("articles");
  cacheTag("stories");
  cacheLife("minutes");

  let startDate = new Date(0);
  let daysToChart = 7;
  
  if (timeRange === "24h") {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    daysToChart = 1;
  } else if (timeRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    daysToChart = 7;
  } else if (timeRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    daysToChart = 30;
  } else if (timeRange === "all") {
    startDate = new Date(0);
    daysToChart = 30; // Limit charts to max 30 days
  }

  const chartStartDate = new Date(Date.now() - daysToChart * 24 * 60 * 60 * 1000);
  const staleThreshold = 1000 * 60 * 60 * 6; // 6 hours

  try {
    const [
      processedArticles,
      storyClusters,
      topicFindings,
      lockedTopics,
      categories,
      aiUsage,
      rawArticlesRange,
      processedArticlesRange,
      sourcesSummary,
      
      // New telemetry
      chatSessions,
      chatMessagesCount,
      chatToolRunsCount,
      topicSources,
      storyImpacts,
      modelUtil,
    ] = await Promise.all([
      // Existing
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
      prisma.storyCluster.count({ where: { isActive: true, createdAt: { gte: startDate } } }),
      prisma.topicFinding.count({ where: { foundAt: { gte: startDate } } }),
      prisma.lockedTopic.count({ where: { createdAt: { gte: startDate } } }),
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
      prisma.aiUsage.findMany({
        where: { createdAt: { gte: chartStartDate } },
        orderBy: { date: "asc" },
      }),
      prisma.rawArticle.findMany({
        where: { fetchedAt: { gte: chartStartDate } },
        select: { fetchedAt: true },
      }),
      prisma.processedArticle.findMany({
        where: {
          processedAt: { gte: chartStartDate },
          clusterStatus: { not: "SKIPPED" },
        },
        select: { processedAt: true },
      }),
      prisma.rawArticle.groupBy({
        by: ["source"],
        _count: { _all: true },
        _max: { fetchedAt: true },
        where: { fetchedAt: { gte: startDate } },
      }),
      
      // New
      prisma.chatSession.findMany({
        where: { createdAt: { gte: startDate } },
        select: { model: true }
      }),
      prisma.chatMessage.count({ where: { createdAt: { gte: startDate } } }),
      prisma.chatToolRun.count({ where: { createdAt: { gte: startDate } } }),
      prisma.topicFinding.groupBy({
        by: ["sourceType"],
        _count: { _all: true },
        where: { foundAt: { gte: startDate } }
      }),
      prisma.storyCluster.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { isActive: true, createdAt: { gte: startDate } }
      }),
      prisma.processedArticle.groupBy({
        by: ["model"],
        _count: { _all: true },
        where: {
          processedAt: { gte: startDate },
          clusterStatus: { not: "SKIPPED" },
        }
      })
    ]);

    const totalArticles = processedArticles.length;

    // ── Ingestion Volume ──────────────────────────────────────
    const volumeByDate: Record<string, { raw: number; processed: number }> = {};
    for (let i = daysToChart - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      volumeByDate[d] = { raw: 0, processed: 0 };
    }

    rawArticlesRange.forEach((a) => {
      const d = a.fetchedAt.toISOString().split("T")[0];
      if (volumeByDate[d]) volumeByDate[d].raw++;
    });
    processedArticlesRange.forEach((a) => {
      const d = a.processedAt.toISOString().split("T")[0];
      if (volumeByDate[d]) volumeByDate[d].processed++;
    });

    const ingestionVolumeChart = Object.entries(volumeByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    const totalRawCount = rawArticlesRange.length;
    const totalProcessedCount = processedArticlesRange.length;
    const dedupRate = totalRawCount > 0 ? Math.round((1 - totalProcessedCount / totalRawCount) * 100) : 0;

    const sourceHealth = sourcesSummary
      .map((s) => ({
        name: s.source,
        count: s._count._all,
        lastFetch: s._max.fetchedAt ?? new Date(),
        isStale: s._max.fetchedAt ? Date.now() - s._max.fetchedAt.getTime() > staleThreshold : true,
      }))
      .sort((a, b) => b.lastFetch.getTime() - a.lastFetch.getTime());

    // ── Event Region Distribution ──────────────────────────────────────────────
    const regionCounts: Record<string, number> = {
      "North America": 0, "Europe": 0, "Middle East": 0, "Asia-Pacific": 0, "South America": 0, "Africa": 0, "Global": 0, "Unknown": 0,
    };
    for (const a of processedArticles) {
      const reg = a.eventRegion;
      if (!reg) regionCounts["Unknown"]++;
      else if (regionCounts[reg] !== undefined) regionCounts[reg]++;
      else regionCounts["Unknown"]++;
    }
    const regionColors: Record<string, string> = {
      "North America": "#3b82f6", "Europe": "#10b981", "Middle East": "#ef4444", "Asia-Pacific": "#f59e0b", "South America": "#8b5cf6", "Africa": "#ec4899", "Global": "#6b7280", "Unknown": "#9ca3af",
    };
    const eventRegionDistribution = Object.entries(regionCounts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({
        label,
        count,
        color: regionColors[label] ?? "#9ca3af",
        percentage: totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
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
        percentage: totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }));

    // ── Category Breakdown ─────────────────────────────────────────────────────
    const totalCategoryArticles = categories.reduce((s, c) => s + c._count.articles, 0);
    const categoryBreakdown = categories
      .map((c) => ({
        name: c.name,
        count: c._count.articles,
        percentage: totalCategoryArticles > 0 ? Math.round((c._count.articles / totalCategoryArticles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Sentiment Distribution ─────────────────────────────────────────────────
    const sentimentBuckets = [
      { label: "Very Negative", range: [-1, -0.6] as [number, number], count: 0 },
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
          if (a.sentimentScore >= bucket.range[0] && a.sentimentScore < bucket.range[1]) {
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

    // ── AI Usage ──────────────────────────────────────────────────
    const usageByDate: Record<string, { tokensUsed: number; estimatedCost: number }> = {};
    for (const u of aiUsage) {
      if (!usageByDate[u.date]) usageByDate[u.date] = { tokensUsed: 0, estimatedCost: 0 };
      usageByDate[u.date].tokensUsed += u.tokensUsed;
      usageByDate[u.date].estimatedCost += u.estimatedCost;
    }
    const aiUsageChart = Object.entries(usageByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // ── New Telemetry ──────────────────────────────────────────────────
    const totalModelUses = modelUtil.reduce((s, m) => s + m._count._all, 0);
    const modelUtilization = modelUtil
      .filter(m => m.model)
      .map(m => ({
        model: m.model || "Unknown",
        count: m._count._all,
        percentage: totalModelUses > 0 ? Math.round((m._count._all / totalModelUses) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const totalTopicSources = topicSources.reduce((s, t) => s + t._count._all, 0);
    const topicSourceDistribution = topicSources
      .map(t => ({
        source: t.sourceType,
        count: t._count._all,
        percentage: totalTopicSources > 0 ? Math.round((t._count._all / totalTopicSources) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const storyImpactDistribution = storyImpacts
      .map(s => ({
        status: s.status || "UNKNOWN",
        count: s._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const activeChatModels: Record<string, number> = {};
    chatSessions.forEach(s => {
      if (s.model) activeChatModels[s.model] = (activeChatModels[s.model] || 0) + 1;
    });

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
        percentage: totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
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
        percentage: totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const chatTelemetry = {
      totalSessions: chatSessions.length,
      totalMessages: chatMessagesCount,
      totalToolRuns: chatToolRunsCount,
      activeModels: Object.entries(activeChatModels)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
    };

    return {
      eventRegionDistribution,
      topSourceCountries,
      categoryBreakdown,
      sentimentDistribution: sentimentBuckets,
      totalArticles,
      totalStories: storyClusters,
      totalFindings: topicFindings,
      totalTopics: lockedTopics,
      avgSentiment: sentimentCount > 0 ? sentimentSum / sentimentCount : null,
      topEntities,
      aiUsageChart,
      sourceHealth,
      ingestionVolumeChart,
      dedupRate,
      modelUtilization,
      topicSourceDistribution,
      storyImpactDistribution,
      biasGroupDistribution,
      coverageScopeDistribution,
      chatTelemetry,
    };
  } catch (error) {
    console.error("getAnalyticsData error:", error);
    return {
      eventRegionDistribution: [], topSourceCountries: [], categoryBreakdown: [], sentimentDistribution: [],
      totalArticles: 0, totalStories: 0, totalFindings: 0, totalTopics: 0, avgSentiment: null,
      topEntities: [], aiUsageChart: [], sourceHealth: [], ingestionVolumeChart: [], dedupRate: 0,
      modelUtilization: [], topicSourceDistribution: [], storyImpactDistribution: [],
      biasGroupDistribution: [], coverageScopeDistribution: [],
      chatTelemetry: { totalSessions: 0, totalMessages: 0, totalToolRuns: 0, activeModels: [] }
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

    const all = rawCounts.reduce((acc, curr) => acc + (curr._count?._all ?? 0), 0);

    const counts = rawCounts.reduce((acc, curr) => {
      const origin = getPublisherRegion(curr.sourceCountry);
      acc[origin] = (acc[origin] ?? 0) + (curr._count?._all ?? 0);
      return acc;
    }, {} as Record<string, number>);

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
          isNot: null,
          clusterStatus: { not: "SKIPPED" },
        },
      },
    });

    const all = rawCounts.reduce((acc, curr) => acc + curr._count._all, 0);

    const counts = rawCounts.reduce((acc, curr) => {
      const bias = curr.biasGroup || "Unknown";
      acc[bias] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

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
            .filter((p): p is string => !!p)
        )
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
