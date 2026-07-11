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

export function buildArticleWhereClause(
  params: FilterParams,
): Prisma.ProcessedArticleWhereInput {
  const {
    category,
    search,
    region,
    srcOrigin,
    type,
    story,
    bias,
    scope,
    date,
    enabledSources,
    hiddenCategories,
  } = params;

  const AND: Prisma.ProcessedArticleWhereInput[] = [
    // 1. Default System Filters
    // Always exclude articles marked as SKIPPED by the clustering engine
    { clusterStatus: { not: "SKIPPED" } },
  ];

  // 2. User Preferences (Settings)
  // Hide categories the user has explicitly muted in their settings
  if (hiddenCategories && hiddenCategories.length > 0) {
    AND.push({ categories: { none: { name: { in: hiddenCategories } } } });
  }

  // Only show articles from sources the user has enabled (builtin + custom)
  if (enabledSources && enabledSources.length > 0) {
    AND.push({ rawArticle: { is: { source: { in: enabledSources } } } });
  }

  // 3. Search Keyword Matching
  // Split search string by whitespace and require every word to match (AND array of OR clauses)
  const words = search?.trim().split(/\s+/).filter(Boolean) || [];
  if (words.length > 0) {
    words.forEach((word) => {
      AND.push({
        OR: [
          {
            rawArticle: {
              is: { title: { contains: word, mode: "insensitive" } },
            },
          },
          {
            rawArticle: {
              is: { contentSnippet: { contains: word, mode: "insensitive" } },
            },
          },
          {
            rawArticle: {
              is: { source: { contains: word, mode: "insensitive" } },
            },
          },
        ],
      });
    });
  }

  // 4. Exact Match Filters (Dropdowns)
  if (category && category !== "all") {
    AND.push({ categories: { some: { name: category } } });
  }

  if (region && region !== "all") {
    AND.push({ eventRegion: { equals: region, mode: "insensitive" } });
  }

  if (type && type !== "all") {
    AND.push({
      rawArticle: { is: { sourceType: { equals: type, mode: "insensitive" } } },
    });
  }

  if (bias && bias !== "all") {
    AND.push({
      rawArticle: { is: { biasGroup: { equals: bias, mode: "insensitive" } } },
    });
  }

  if (scope && scope !== "all") {
    AND.push({
      rawArticle: {
        is: { coverageScope: { equals: scope, mode: "insensitive" } },
      },
    });
  }

  if (story && story !== "all") {
    AND.push({ storyClusters: { some: { slug: story } } });
  }

  // 5. Source Origin Country Mapping
  // The UI passes a "region" (e.g., "Europe"), but the DB stores exact ISO countries
  if (srcOrigin && srcOrigin !== "all") {
    const matchingCountries =
      REGION_TO_COUNTRIES[srcOrigin.toLowerCase()] || [];
    if (matchingCountries.length > 0) {
      AND.push({
        rawArticle: { is: { sourceCountry: { in: matchingCountries } } },
      });
    } else {
      // If no countries match the mapped region, force a failure condition
      AND.push({ id: "NOT_FOUND" });
    }
  }

  // 6. Time Range Bounding (Daily Mode)
  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      AND.push({
        rawArticle: {
          is: { publishedAt: { gte: startOfDay, lte: endOfDay } },
        },
      });
    }
  }

  return { AND };
}

export async function executeFilterQuery(
  params: FilterParams,
  take: number,
): Promise<{ articles: Article[]; nextCursor: string | null }> {
  const { sort, cursor } = params;

  try {
    const where = buildArticleWhereClause(params);

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
      where,
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
