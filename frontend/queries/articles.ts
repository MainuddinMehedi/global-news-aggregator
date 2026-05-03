import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { Article } from "@/types/article";

interface getArticlesParams {
  category: string;
  sort: string;
  search: string;
  cursor?: string;
}

const TAKE = 20;

export async function getArticles({
  category,
  sort,
  search,
  cursor,
}: getArticlesParams): Promise<{
  articles: Article[];
  nextCursor: string | null;
}> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  const categoryFilter =
    category !== "all"
      ? [
          {
            categories: {
              some: {
                name: category,
              },
            },
          },
        ]
      : [];

  // id tiebreaker makes cursor position unambiguous when publishedAt ties
  const orderBy =
    sort === "bias"
      ? [{ sentimentScore: "desc" as const }, { id: "asc" as const }]
      : [
          { rawArticle: { publishedAt: "desc" as const } },
          { id: "asc" as const },
        ];

  const searchFilter =
    search.trim() !== ""
      ? [
          {
            OR: [
              {
                rawArticle: {
                  title: { contains: search, mode: "insensitive" as const },
                },
              },
              {
                rawArticle: {
                  contentSnippet: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                rawArticle: {
                  source: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          },
        ]
      : [];

  try {
    // Fetch TAKE + 1 to detect whether a next page exists without a COUNT query
    const raw = await prisma.processedArticle.findMany({
      take: TAKE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        AND: [...categoryFilter, ...searchFilter],
      },
      orderBy,
      include: {
        rawArticle: true,
        categories: true,
      },
    });

    const hasMore = raw.length > TAKE;
    const trimmed = hasMore ? raw.slice(0, TAKE) : raw;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

    // preparing the articles array
    const articles = trimmed.map((article) => ({
      id: article.id,
      title: article.rawArticle.title,
      source: article.rawArticle.source,
      publishedAt: article.rawArticle.publishedAt.toISOString(),
      contentSnippet: article.rawArticle.contentSnippet,
      biasNote: article.biasNote,
      biasCategory: article.biasCategory,
      sentimentScore: article.sentimentScore,
      perspectiveCountries: article.perspectiveCountries,
      url: article.rawArticle.url,
      categories: article.categories,
      entities: article.entities,
      sourceCountry: article.rawArticle.sourceCountry,
    }));

    return { articles, nextCursor };
  } catch (error) {
    console.log("getArticles error:", error);
    throw new Error("Failed to fetch articles from the database");
  }
}

// {
//   rawArticle: {
//     source: {
//       not: "Jagonews24",
//     },
//   },
// },

export async function getArticleById(id: string): Promise<Article | null> {
  "use cache";
  cacheTag(`article-${id}`);
  cacheLife("days");

  try {
    const raw = await prisma.processedArticle.findUnique({
      where: { id },
      include: {
        rawArticle: true,
        categories: true,
      },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      title: raw.rawArticle.title,
      source: raw.rawArticle.source,
      publishedAt: raw.rawArticle.publishedAt.toISOString(),
      contentSnippet: raw.rawArticle.contentSnippet,
      biasNote: raw.biasNote,
      biasCategory: raw.biasCategory,
      sentimentScore: raw.sentimentScore,
      perspectiveCountries: raw.perspectiveCountries,
      url: raw.rawArticle.url,
      categories: raw.categories,
      entities: raw.entities,
      sourceCountry: raw.rawArticle.sourceCountry,
    };
  } catch (error) {
    console.log("getArticleById error: ", error);
    throw new Error("Failed to fetch article from the database");
  }
}
