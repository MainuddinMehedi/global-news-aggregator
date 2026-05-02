import prisma from "@/lib/prisma";
import { Article } from "@/types/article";

interface getArticlesParams {
  category: string;
  sort: string;
}

export async function getArticles({ category, sort }: getArticlesParams) {
  const categoryFilter =
    category !== "all"
      ? {
          categories: {
            some: {
              name: category,
            },
          },
        }
      : {};

  const orderBy =
    sort === "bias"
      ? { sentimentScore: "desc" as const }
      : { rawArticle: { publishedAt: "desc" as const } };

  const articles = await prisma.processedArticle.findMany({
    take: 20,
    where: {
      rawArticle: {
        source: {
          not: "Jagonews24",
        },
      },
      ...categoryFilter,
    },
    orderBy,
    include: {
      rawArticle: true,
      categories: true,
    },
  });

  const preparedArticles = articles.map((article) => ({
    id: article.id,
    title: article.rawArticle.title,
    source: article.rawArticle.source,
    publishedAt: article.rawArticle.publishedAt,
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

  return preparedArticles;
}
