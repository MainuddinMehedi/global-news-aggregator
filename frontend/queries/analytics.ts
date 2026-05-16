import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";

export interface AnalyticsData {
  biasDistribution: {
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
  aiUsageLast7Days: {
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
  ingestionVolumeLast7Days: {
    date: string;
    raw: number;
    processed: number;
  }[];
  dedupRate: number;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  "use cache";
  cacheTag("analytics");
  cacheTag("articles");
  cacheTag("stories");
  cacheLife("minutes");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleThreshold = 1000 * 60 * 60 * 6; // 6 hours

  const [
    processedArticles,
    storyClusters,
    topicFindings,
    lockedTopics,
    categories,
    aiUsage,
    rawArticlesLast7Days,
    processedArticlesLast7Days,
    sourcesSummary,
  ] = await Promise.all([
    prisma.processedArticle.findMany({
      select: {
        biasCategory: true,
        sentimentScore: true,
        entities: true,
        rawArticle: {
          select: { sourceCountry: true },
        },
      },
      take: 2000,
      orderBy: { processedAt: "desc" },
    }),
    prisma.storyCluster.count({ where: { isActive: true } }),
    prisma.topicFinding.count(),
    prisma.lockedTopic.count(),
    prisma.category.findMany({
      include: {
        _count: { select: { articles: true } },
      },
      orderBy: {
        articles: { _count: "desc" },
      },
      take: 11,
    }),
    prisma.aiUsage.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "asc" },
    }),
    prisma.rawArticle.findMany({
      where: { fetchedAt: { gte: sevenDaysAgo } },
      select: { fetchedAt: true },
    }),
    prisma.processedArticle.findMany({
      where: { processedAt: { gte: sevenDaysAgo } },
      select: { processedAt: true },
    }),
    prisma.rawArticle.groupBy({
      by: ["source"],
      _count: { _all: true },
      _max: { fetchedAt: true },
      where: { fetchedAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const totalArticles = processedArticles.length;

  // ── Ingestion Volume & Source Health ──────────────────────────────────────
  const volumeByDate: Record<string, { raw: number; processed: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    volumeByDate[d] = { raw: 0, processed: 0 };
  }

  rawArticlesLast7Days.forEach((a) => {
    const d = a.fetchedAt.toISOString().split("T")[0];
    if (volumeByDate[d]) volumeByDate[d].raw++;
  });
  processedArticlesLast7Days.forEach((a) => {
    const d = a.processedAt.toISOString().split("T")[0];
    if (volumeByDate[d]) volumeByDate[d].processed++;
  });

  const ingestionVolumeLast7Days = Object.entries(volumeByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  const totalRawCount = rawArticlesLast7Days.length;
  const totalProcessedCount = processedArticlesLast7Days.length;
  const dedupRate =
    totalRawCount > 0
      ? Math.round((1 - totalProcessedCount / totalRawCount) * 100)
      : 0;

  const sourceHealth = sourcesSummary
    .map((s) => ({
      name: s.source,
      count: s._count._all,
      lastFetch: s._max.fetchedAt ?? new Date(),
      isStale: s._max.fetchedAt
        ? Date.now() - s._max.fetchedAt.getTime() > staleThreshold
        : true,
    }))
    .sort((a, b) => b.lastFetch.getTime() - a.lastFetch.getTime());

  // ── Bias Distribution ──────────────────────────────────────────────────────
  const biasCounts: Record<string, number> = {
    Western: 0,
    "Non-Western": 0,
    Eastern: 0,
    Neutral: 0,
    Unknown: 0,
  };
  for (const a of processedArticles) {
    const cat = a.biasCategory;
    if (!cat) biasCounts["Unknown"]++;
    else if (biasCounts[cat] !== undefined) biasCounts[cat]++;
    else biasCounts["Unknown"]++;
  }
  const biasColors: Record<string, string> = {
    Western: "#3b82f6",
    "Non-Western": "#10b981",
    Eastern: "#ef4444",
    Neutral: "#f59e0b",
    Unknown: "#6b7280",
  };
  const biasDistribution = Object.entries(biasCounts)
    .filter(([, count]) => count > 0)
    .map(([label, count]) => ({
      label,
      count,
      color: biasColors[label] ?? "#6b7280",
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
  const categoryBreakdown = categories.map((c) => ({
    name: c.name,
    count: c._count.articles,
    percentage:
      totalCategoryArticles > 0
        ? Math.round((c._count.articles / totalCategoryArticles) * 100)
        : 0,
  }));

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

  // ── AI Usage Last 7 Days ──────────────────────────────────────────────────
  const usageByDate: Record<
    string,
    { tokensUsed: number; estimatedCost: number }
  > = {};
  for (const u of aiUsage) {
    if (!usageByDate[u.date])
      usageByDate[u.date] = { tokensUsed: 0, estimatedCost: 0 };
    usageByDate[u.date].tokensUsed += u.tokensUsed;
    usageByDate[u.date].estimatedCost += u.estimatedCost;
  }
  const aiUsageLast7Days = Object.entries(usageByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return {
    biasDistribution,
    topSourceCountries,
    categoryBreakdown,
    sentimentDistribution: sentimentBuckets,
    totalArticles,
    totalStories: storyClusters,
    totalFindings: topicFindings,
    totalTopics: lockedTopics,
    avgSentiment: sentimentCount > 0 ? sentimentSum / sentimentCount : null,
    topEntities,
    aiUsageLast7Days,
    sourceHealth,
    ingestionVolumeLast7Days,
    dedupRate,
  };
}
