import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getStoryClusters() {
  "use cache";
  cacheTag("stories");
  cacheLife("minutes");

  try {
    const clusters = await prisma.storyCluster.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { articles: true },
        },
      },
      take: 50, // limit to 50 active stories
    });

    return clusters.map((cluster) => ({
      id: cluster.id,
      slug: cluster.slug,
      title: cluster.title,
      summary: cluster.summary,
      timeWindow: cluster.timeWindow || "Recent",
      articleCount:
        cluster.articleCount > 0
          ? cluster.articleCount
          : cluster._count.articles,
      // Intelligence fields
      impact: cluster.impact,
      status: cluster.status,
      regions: cluster.regions || [],
      themes: cluster.themes || [],
      whyItMatters: cluster.whyItMatters,
      keyDevelopments: (cluster.keyDevelopments || []) as unknown as Array<{
        title: string;
        date: string;
      }>,
      updatedAt: cluster.updatedAt.toISOString(),
      trendData: cluster.trendData,
    }));
  } catch (error) {
    console.log("getStoryClusters error:", error);
    throw new Error("Failed to fetch story clusters from the database");
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
      articleCount:
        cluster.articleCount > 0
          ? cluster.articleCount
          : cluster.articles.length,
      keyDevelopments: (cluster.keyDevelopments || []) as unknown as Array<{
        title: string;
        date: string;
        description?: string;
      }>,
      updatedAt: cluster.updatedAt.toISOString(),
    };
  } catch (error) {
    console.log(`getStoryDetail error for slug ${slug}:`, error);
    throw new Error("Failed to fetch story details");
  }
}
