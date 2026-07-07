import prisma from "@/lib/prisma";
import { getPublisherRegion } from "@/utils/regions";
import { cacheLife, cacheTag } from "next/cache";

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
