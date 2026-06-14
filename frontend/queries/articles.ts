import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { Article } from "@/types/article";

interface getArticlesParams {
  category: string;
  sort: string;
  search: string;
  region?: string;
  origin?: string;
  type?: string;
  story?: string;
  bias?: string;
  scope?: string;
  cursor?: string;
  enabledSources?: string[];
}

const TAKE = 20;

export async function getArticles({
  category,
  sort,
  search,
  region,
  origin,
  type,
  story,
  bias,
  scope,
  cursor,
  enabledSources,
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

  let regionFilter: any[] = [];
  if (region && region !== "all") {
    regionFilter = [{ eventRegion: region }];
  }

  let originFilter: any[] = [];
  if (origin && origin !== "all") {
    originFilter = [{ rawArticle: { sourceOrigin: origin } }];
  }

  let typeFilter: any[] = [];
  if (type && type !== "all") {
    typeFilter = [{ rawArticle: { sourceType: type } }];
  }

  let biasFilter: any[] = [];
  if (bias && bias !== "all") {
    biasFilter = [{ rawArticle: { biasGroup: bias } }];
  }

  let scopeFilter: any[] = [];
  if (scope && scope !== "all") {
    scopeFilter = [{ rawArticle: { coverageScope: scope } }];
  }

  let sourcesFilter: any[] = [];
  if (enabledSources) {
    sourcesFilter = [{ rawArticle: { source: { in: enabledSources } } }];
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
        AND: [
          ...categoryFilter,
          ...searchFilter,
          ...regionFilter,
          ...originFilter,
          ...typeFilter,
          ...biasFilter,
          ...scopeFilter,
          ...storyFilter,
          ...sourcesFilter,
        ],
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
      eventRegion: article.eventRegion,
      sentimentScore: article.sentimentScore,
      url: article.rawArticle.url,
      categories: article.categories,
      entities: article.entities,
      sourceCountry: article.rawArticle.sourceCountry,
      sourceOrigin: article.rawArticle.sourceOrigin,
      sourceType: article.rawArticle.sourceType,
      biasGroup: article.rawArticle.biasGroup,
      coverageScope: article.rawArticle.coverageScope,
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
      eventRegion: raw.eventRegion,
      sentimentScore: raw.sentimentScore,
      url: raw.rawArticle.url,
      categories: raw.categories,
      entities: raw.entities,
      sourceCountry: raw.rawArticle.sourceCountry,
      sourceOrigin: raw.rawArticle.sourceOrigin,
      sourceType: raw.rawArticle.sourceType,
      biasGroup: raw.rawArticle.biasGroup,
      coverageScope: raw.rawArticle.coverageScope,
      slug: raw.rawArticle.slug,
    };
  } catch (error) {
    console.log("getArticleById error: ", error);
    return null;
  }
}
