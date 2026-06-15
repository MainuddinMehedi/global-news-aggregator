import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { getPublisherRegion } from "@/lib/utils";

export async function getStoryClusters(search?: string) {
  "use cache";
  cacheTag("stories");
  cacheLife("minutes");

  const words = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  const searchFilter =
    words.length > 0
      ? {
          AND: [
            { isActive: true },
            ...words.map((word) => ({
              OR: [
                { title: { contains: word, mode: "insensitive" as const } },
                {
                  summary: { contains: word, mode: "insensitive" as const },
                },
              ],
            })),
          ],
        }
      : { isActive: true };

  try {
    const clusters = await prisma.storyCluster.findMany({
      where: searchFilter,
      orderBy: { updatedAt: "desc" },
      include: {
        articles: {
          select: {
            rawArticle: {
              select: {
                source: true,
                url: true,
                sourceCountry: true,
              },
            },
          },
        },
        _count: {
          select: { articles: true },
        },
      },
      take: 50,
    });

    return clusters.map((cluster) => {
      const sourcesMap = new Map<string, string>();
      const originsSet = new Set<string>();
      cluster.articles.forEach((art) => {
        if (art.rawArticle.source && !sourcesMap.has(art.rawArticle.source)) {
          sourcesMap.set(art.rawArticle.source, art.rawArticle.url);
        }
        const region = getPublisherRegion(art.rawArticle.sourceCountry);
        if (region) {
          originsSet.add(region);
        }
      });
      const sources = Array.from(sourcesMap.entries()).map(([name, url]) => ({
        name,
        url,
      }));
      const origins = Array.from(originsSet);

      return {
        id: cluster.id,
        slug: cluster.slug,
        title: cluster.title,
        summary: cluster.summary,
        timeWindow: cluster.timeWindow || "Recent",
        articleCount: cluster._count.articles,
        // Intelligence fields
        impact: cluster.impact,
        status: cluster.status,
        regions: cluster.regions || [],
        themes: cluster.themes || [],
        sourceCount: cluster.sourceCount || 0,
        topSources: cluster.topSources || [],
        sources,
        origins,
        whyItMatters: cluster.whyItMatters,
        keyDevelopments: (cluster.keyDevelopments || []) as unknown as Array<{
          title: string;
          date: string;
        }>,
        updatedAt: cluster.updatedAt.toISOString(),
        trendData: cluster.trendData,
      };
    });
  } catch (error) {
    console.log("getStoryClusters error:", error);
    return [];
  }
}

export async function getStoryDetail(slug: string) {
  "use cache";
  cacheTag(`story-${slug}`);
  cacheLife("minutes");

  try {
    const cluster = await prisma.storyCluster.findUnique({
      where: { slug },
      include: {
        articles: {
          include: { rawArticle: true, categories: true },
          orderBy: { processedAt: "desc" },
        },
      },
    });

    if (!cluster) return null;

    return {
      ...cluster,
      articleCount: cluster.articles.length,
      keyDevelopments: (cluster.keyDevelopments || []) as unknown as Array<{
        title: string;
        date: string;
        description?: string;
      }>,
      updatedAt: cluster.updatedAt.toISOString(),
    };
  } catch (error) {
    console.log(`getStoryDetail error for slug ${slug}:`, error);
    return null;
  }
}
