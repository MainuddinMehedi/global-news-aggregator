import prisma from "@/lib/prisma";
import { Article } from "@/types/article";

export async function getArticles() {
  const articles = await prisma.rawArticle.findMany({
    take: 20,
    orderBy: {
      fetchedAt: "desc",
    },
  });

  return articles;
}
