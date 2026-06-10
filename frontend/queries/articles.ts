import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { Article } from "@/types/article";

interface getArticlesParams {
  category: string;
  sort: string;
  search: string;
  perspective?: string;
  story?: string;
  cursor?: string;
}

const TAKE = 20;

export async function getArticles({
  category,
  sort,
  search,
  perspective,
  story,
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

  const wireSources = ["reuters", "ap", "associated press", "bloomberg", "afp", "press association", "upi"];

  let perspectiveFilter: any[] = [];
  if (perspective && perspective !== "all") {
    if (perspective.toLowerCase() === "wire") {
      perspectiveFilter = [
        {
          rawArticle: {
            OR: wireSources.map((w) => ({
              source: { contains: w, mode: "insensitive" as const },
            })),
          },
        },
      ];
    } else {
      let formattedBias = perspective.trim();
      if (formattedBias.toLowerCase() === "western") formattedBias = "Western";
      else if (formattedBias.toLowerCase() === "eastern") formattedBias = "Eastern";
      else if (formattedBias.toLowerCase() === "non-western") formattedBias = "Non-Western";
      else if (formattedBias.toLowerCase() === "neutral") formattedBias = "Neutral";

      perspectiveFilter = [
        {
          biasCategory: formattedBias,
        },
      ];
    }
  }

  const storyFilter =
    story && story !== "all"
      ? [
          {
            storyClusters: {
              some: {
                slug: story,
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

  const words = search.trim().split(/\s+/).filter(Boolean);
  const searchFilter =
    words.length > 0
      ? words.map((word) => ({
          OR: [
            {
              rawArticle: {
                title: { contains: word, mode: "insensitive" as const },
              },
            },
            {
              rawArticle: {
                contentSnippet: {
                  contains: word,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              rawArticle: {
                source: { contains: word, mode: "insensitive" as const },
              },
            },
          ],
        }))
      : [];

  try {
    // Fetch TAKE + 1 to detect whether a next page exists without a COUNT query
    const raw = await prisma.processedArticle.findMany({
      take: TAKE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        AND: [...categoryFilter, ...searchFilter, ...perspectiveFilter, ...storyFilter],
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
      extractedContent: article.rawArticle.extractedContent,
      biasNote: article.biasNote,
      biasCategory: article.biasCategory,
      sentimentScore: article.sentimentScore,
      perspectiveCountries: article.perspectiveCountries,
      url: article.rawArticle.url,
      categories: article.categories,
      entities: article.entities,
      sourceCountry: article.rawArticle.sourceCountry,
      slug: article.rawArticle.slug,
    }));

    return { articles, nextCursor };
  } catch (error) {
    console.log("getArticles error:", error);
    return { articles: [], nextCursor: null };
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

    return {
      id: raw.id,
      title: raw.rawArticle.title,
      source: raw.rawArticle.source,
      publishedAt: raw.rawArticle.publishedAt.toISOString(),
      contentSnippet: raw.rawArticle.contentSnippet,
      extractedContent: raw.rawArticle.extractedContent,
      biasNote: raw.biasNote,
      biasCategory: raw.biasCategory,
      sentimentScore: raw.sentimentScore,
      perspectiveCountries: raw.perspectiveCountries,
      url: raw.rawArticle.url,
      categories: raw.categories,
      entities: raw.entities,
      sourceCountry: raw.rawArticle.sourceCountry,
      slug: raw.rawArticle.slug,
    };
  } catch (error) {
    console.log("getArticleById error: ", error);
    return null;
  }
}
