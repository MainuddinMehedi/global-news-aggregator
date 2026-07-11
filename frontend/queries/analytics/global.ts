import prisma from "@/lib/prisma";
import { calculateDistribution, getStartDate } from "@/utils/analytics";
import { DEFAULT_CHART_COLOR, METADATA_COLORS } from "@/utils/colors";
import { cacheLife, cacheTag } from "next/cache";

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

export async function getGlobalAnalyticsData(
  timeRange: string = "7d",
): Promise<GlobalAnalyticsData> {
  "use cache";
  cacheTag(`analytics-global-${timeRange}`, "articles", "stories");
  cacheLife("minutes");

  const startDate = getStartDate(timeRange);

  try {
    const baseWhere = {
      processedAt: { gte: startDate },
      clusterStatus: { not: "SKIPPED" },
    };

    const rawWhere = {
      processedArticle: {
        is: baseWhere,
      },
    };

    const [
      regionStats,
      countryStats,
      categoryStats,
      totalStories,
      sentimentStats,
      topEntitiesRaw,
      biasStats,
      scopeStats,
    ] = await Promise.all([
      // 1. Event Regions
      prisma.processedArticle.groupBy({
        by: ["eventRegion"],
        _count: { _all: true },
        where: baseWhere,
      }),
      // 2. Source Countries
      prisma.rawArticle.groupBy({
        by: ["sourceCountry"],
        _count: { _all: true },
        where: rawWhere,
      }),
      // 3. Category Breakdown (using standard include logic for relations)
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: baseWhere,
              },
            },
          },
        },
      }),
      // 4. Stories
      prisma.storyCluster.count({
        where: { isActive: true, createdAt: { gte: startDate } },
      }),
      // 5. Sentiment (fetching just scores to bucket them fast)
      prisma.processedArticle.findMany({
        where: { ...baseWhere, sentimentScore: { not: null } },
        select: { sentimentScore: true },
      }),
      // 6. Top Entities (Raw SQL for unnesting string array)
      prisma.$queryRaw`
        SELECT entity, CAST(COUNT(*) AS INTEGER) as count
        FROM "ProcessedArticle", unnest(entities) as entity
        WHERE "processedAt" >= ${startDate} AND "clusterStatus" != 'SKIPPED'
        GROUP BY entity
        ORDER BY count DESC
        LIMIT 12;
      ` as Promise<Array<{ entity: string; count: number }>>,
      // 7. Bias Groups
      prisma.rawArticle.groupBy({
        by: ["biasGroup"],
        _count: { _all: true },
        where: rawWhere,
      }),
      // 8. Coverage Scopes
      prisma.rawArticle.groupBy({
        by: ["coverageScope"],
        _count: { _all: true },
        where: rawWhere,
      }),
    ]);

    // We can compute totalArticles directly from sentiment + nulls, or do a count.
    // To save a query, we'll just fire a single count query.
    const totalArticles = await prisma.processedArticle.count({
      where: baseWhere,
    });

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

    for (const row of regionStats) {
      const reg = row.eventRegion;
      const count = row._count._all;

      if (!reg) regionCounts["Unknown"] += count;
      else if (regionCounts[reg] !== undefined) regionCounts[reg] += count;
      else regionCounts["Unknown"] += count;
    }

    const eventRegionDistribution = calculateDistribution(
      regionCounts,
      totalArticles,
    )
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        color:
          METADATA_COLORS.region[
            item.label as keyof typeof METADATA_COLORS.region
          ] ?? DEFAULT_CHART_COLOR,
      }));

    // ── Top Source Countries ───────────────────────────────────────────────────
    const countryCounts: Record<string, number> = {};

    for (const row of countryStats) {
      const c = row.sourceCountry ?? "Unknown";
      countryCounts[c] = (countryCounts[c] ?? 0) + row._count._all;
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
    const totalCategoryArticles = categoryStats.reduce(
      (s, c) => s + c._count.articles,
      0,
    );
    const categoryBreakdown = categoryStats
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

    for (const row of sentimentStats) {
      if (row.sentimentScore != null) {
        sentimentSum += row.sentimentScore;
        sentimentCount++;
        for (const bucket of sentimentBuckets) {
          if (
            row.sentimentScore >= bucket.range[0] &&
            row.sentimentScore < bucket.range[1]
          ) {
            bucket.count++;
            break;
          }
        }
      }
    }

    // ── Top Entities ──────────────────────────────────────────────────────────
    const topEntities = topEntitiesRaw;

    // ── Bias Group Distribution ──────────────────────────────────────────────
    const biasCounts: Record<string, number> = {};

    for (const row of biasStats) {
      const bias = row.biasGroup ?? "Unknown";
      biasCounts[bias] = (biasCounts[bias] ?? 0) + row._count._all;
    }

    const biasGroupDistribution = calculateDistribution(
      biasCounts,
      totalArticles,
    );

    // ── Coverage Scope Distribution ──────────────────────────────────────────
    const scopeCounts: Record<string, number> = {};

    for (const row of scopeStats) {
      const scope = row.coverageScope ?? "Unknown";
      scopeCounts[scope] = (scopeCounts[scope] ?? 0) + row._count._all;
    }

    const coverageScopeDistribution = calculateDistribution(
      scopeCounts,
      totalArticles,
    );

    return {
      eventRegionDistribution,
      topSourceCountries,
      categoryBreakdown,
      sentimentDistribution: sentimentBuckets,
      totalArticles,
      totalStories,
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
