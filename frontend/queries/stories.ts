import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";

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
      title: cluster.title,
      summary: cluster.summary,
      timeWindow: cluster.timeWindow || "Recent",
      articleCount: cluster._count.articles,
      // @ts-ignore: Prisma Json type
      keyDevelopments: (cluster.keyDevelopments || []) as Array<{ title: string; date: string }>,
      updatedAt: cluster.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.log("getStoryClusters error:", error);
    throw new Error("Failed to fetch story clusters from the database");
  }
}
