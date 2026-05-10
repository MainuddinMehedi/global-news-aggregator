import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getArticleCount() {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  try {
    return await prisma.processedArticle.count();
  } catch (error) {
    console.error("getArticleCount error:", error);
    return 0;
  }
}

export async function getStoryCount() {
  "use cache";
  cacheTag("stories");
  cacheLife("minutes");

  try {
    return await prisma.storyCluster.count({
      where: { isActive: true }
    });
  } catch (error) {
    console.error("getStoryCount error:", error);
    return 0;
  }
}
