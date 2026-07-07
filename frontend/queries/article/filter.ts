import prisma from "@/lib/prisma";
import { Article } from "@/types/article";
import { REGION_TO_COUNTRIES } from "@/utils/regions";
import { Prisma } from "@news/db/client";
import { mapArticle } from "./mapper";

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

    let regionFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (region && region !== "all")
      regionFilter = [{ eventRegion: { equals: region, mode: "insensitive" } }];

    let srcOriginFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (srcOrigin && srcOrigin !== "all") {
      const matchingCountries =
        REGION_TO_COUNTRIES[srcOrigin.toLowerCase()] || [];
      if (matchingCountries.length > 0) {
        srcOriginFilter = [
          { rawArticle: { is: { sourceCountry: { in: matchingCountries } } } },
        ];
      } else {
        // If no countries match the region, return a filter that matches nothing
        srcOriginFilter = [{ id: "NOT_FOUND" }];
      }
    }

    let typeFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (type && type !== "all")
      typeFilter = [
        {
          rawArticle: {
            is: { sourceType: { equals: type, mode: "insensitive" } },
          },
        },
      ];

    let biasFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (bias && bias !== "all")
      biasFilter = [
        {
          rawArticle: {
            is: { biasGroup: { equals: bias, mode: "insensitive" } },
          },
        },
      ];

    let scopeFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (scope && scope !== "all")
      scopeFilter = [
        {
          rawArticle: {
            is: { coverageScope: { equals: scope, mode: "insensitive" } },
          },
        },
      ];

    let sourcesFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (enabledSources)
      sourcesFilter = [
        { rawArticle: { is: { source: { in: enabledSources } } } },
      ];

    const storyFilter: Prisma.ProcessedArticleWhereInput[] =
      story && story !== "all"
        ? [{ storyClusters: { some: { slug: story } } }]
        : [];

    let dateFilter: Prisma.ProcessedArticleWhereInput[] = [];
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        dateFilter = [
          {
            rawArticle: {
              is: { publishedAt: { gte: startOfDay, lte: endOfDay } },
            },
          },
        ];
      }
    }

    const notSkippedFilter = [{ clusterStatus: { not: "SKIPPED" } }];

    const notHiddenFilter =
      hiddenCategories && hiddenCategories.length > 0
        ? [{ categories: { none: { name: { in: hiddenCategories } } } }]
        : [];

    const searchFilter: Prisma.ProcessedArticleWhereInput[] =
      words.length > 0
        ? words.map((word) => ({
            OR: [
              {
                rawArticle: {
                  is: {
                    title: { contains: word, mode: "insensitive" as const },
                  },
                },
              },
              {
                rawArticle: {
                  is: {
                    contentSnippet: {
                      contains: word,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                rawArticle: {
                  is: {
                    source: { contains: word, mode: "insensitive" as const },
                  },
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
      articles: trimmed.map((a) => mapArticle(a)),
      nextCursor,
    };
  } catch (error) {
    console.error("executeFilterQuery error:", error);
    throw new Error("Failed to execute filter query");
  }
}
