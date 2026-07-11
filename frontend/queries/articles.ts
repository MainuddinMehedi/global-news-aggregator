import prisma from "@/lib/prisma";
import { Article } from "@/types/article";
import { cacheLife, cacheTag } from "next/cache";
import { executeFilterQuery, FilterParams } from "./article/filter";
import { mapArticle, RawArticleData } from "./article/mapper";
import { executeSearchQuery } from "./article/search";

interface getArticlesParams extends FilterParams {
  page?: number;
  take?: number;
}

export async function getArticles(params: getArticlesParams): Promise<{
  articles: Article[];
  nextCursor: string | null;
}> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  const { search = "", page = 0, take = 20 } = params;
  const words = search.trim().split(/\s+/).filter(Boolean);

  if (words.length > 0) {
    return executeSearchQuery(search, page, take);
  }

  return executeFilterQuery(params, take);
}

export async function getArticleById(id: string): Promise<Article | null> {
  "use cache";
  cacheTag(`article-${id}`);
  cacheLife("days");

  try {
    const raw = await prisma.processedArticle.findFirst({
      where: {
        OR: [{ id: id }, { rawArticle: { slug: id } }],
      },
      include: {
        rawArticle: true,
        categories: true,
      },
    });

    if (!raw) return null;

    return mapArticle(raw as unknown as RawArticleData);
  } catch (error) {
    console.log("getArticleById error: ", error);
    return null;
  }
}
