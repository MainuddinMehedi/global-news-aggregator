import prisma from "@/lib/prisma";
import { COUNTRY_TO_REGION } from "@/utils/analytics";
import { mapArticle, RawArticleData } from "./mapper";

export interface FilterParams {
  category: string;
  sort: string;
  search: string;
  region?: string;
  srcOrigin?: string;
  type?: string;
  story?: string;
  bias?: string;
  scope?: string;
  cursor?: string;
  date?: string;
  enabledSources?: string[];
  hiddenCategories?: string[];
}

import { Article } from "@/types/article";

export async function executeFilterQuery(
  params: FilterParams,
  take: number,
): Promise<{ articles: Article[]; nextCursor: string | null }> {
  const {
    category,
    sort,
    search,
    region,
    srcOrigin,
    type,
    story,
    bias,
    scope,
    cursor,
    date,
    enabledSources,
    hiddenCategories,
  } = params;

  const words = search.trim().split(/\s+/).filter(Boolean);

  try {
    const categoryFilter =
      category !== "all" ? [{ categories: { some: { name: category } } }] : [];

    let regionFilter: Record<string, unknown>[] = [];
    if (region && region !== "all") regionFilter = [{ eventRegion: region }];

    let srcOriginFilter: Record<string, unknown>[] = [];
    if (srcOrigin && srcOrigin !== "all") {
      const matchingCountries = Object.entries(COUNTRY_TO_REGION)
        .filter(
          ([, regionVal]) => regionVal.toLowerCase() === srcOrigin.toLowerCase(),
        )
        .map(([country]) => country);
      srcOriginFilter = [
        { rawArticle: { sourceCountry: { in: matchingCountries } } },
      ];
    }

    let typeFilter: Record<string, unknown>[] = [];
    if (type && type !== "all")
      typeFilter = [{ rawArticle: { sourceType: type } }];

    let biasFilter: Record<string, unknown>[] = [];
    if (bias && bias !== "all")
      biasFilter = [{ rawArticle: { biasGroup: bias } }];

    let scopeFilter: Record<string, unknown>[] = [];
    if (scope && scope !== "all")
      scopeFilter = [{ rawArticle: { coverageScope: scope } }];

    let sourcesFilter: Record<string, unknown>[] = [];
    if (enabledSources)
      sourcesFilter = [{ rawArticle: { source: { in: enabledSources } } }];

    const storyFilter =
      story && story !== "all"
        ? [{ storyClusters: { some: { slug: story } } }]
        : [];

    let dateFilter: Record<string, unknown>[] = [];
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        dateFilter = [
          { rawArticle: { publishedAt: { gte: startOfDay, lte: endOfDay } } },
        ];
      }
    }

    const notSkippedFilter = [{ clusterStatus: { not: "SKIPPED" } }];

    const notHiddenFilter =
      hiddenCategories && hiddenCategories.length > 0
        ? [{ categories: { none: { name: { in: hiddenCategories } } } }]
        : [];

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

    const orderBy =
      sort === "bias"
        ? [{ sentimentScore: "desc" as const }, { id: "asc" as const }]
        : sort === "oldest"
          ? [
              { rawArticle: { publishedAt: "asc" as const } },
              { id: "asc" as const },
            ]
          : [
              { rawArticle: { publishedAt: "desc" as const } },
              { id: "asc" as const },
            ];

    const raw = await prisma.processedArticle.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        AND: [
          ...categoryFilter,
          ...searchFilter,
          ...notSkippedFilter,
          ...notHiddenFilter,
          ...regionFilter,
          ...srcOriginFilter,
          ...typeFilter,
          ...biasFilter,
          ...scopeFilter,
          ...storyFilter,
          ...dateFilter,
          ...sourcesFilter,
        ],
      },
      orderBy,
      include: { rawArticle: true, categories: true },
    });

    const hasMore = raw.length > take;
    const trimmed = hasMore ? raw.slice(0, take) : raw;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

    return {
      articles: trimmed.map((a) => mapArticle(a as unknown as RawArticleData)),
      nextCursor,
    };
  } catch (error) {
    console.log("executeFilterQuery error:", error);
    return { articles: [], nextCursor: null };
  }
}
