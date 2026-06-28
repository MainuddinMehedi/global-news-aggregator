import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { Article } from "@/types/article";
import { getPublisherRegion, COUNTRY_TO_REGION } from "@/lib/utils";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";

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
  page?: number;
  enabledSources?: string[];
  hiddenCategories?: string[];
}

const TAKE = 20;

function mapArticle(raw: {
  id: string;
  rawArticle: {
    title: string; source: string; publishedAt: Date;
    contentSnippet: string | null; extractedContent: string | null;
    url: string; sourceCountry: string | null;
    sourceType: string | null; biasGroup: string | null;
    coverageScope: string | null; slug: string | null;
  };
  biasNote: string | null;
  eventRegion: string | null;
  sentimentScore: number | null;
  categories: { id: string; name: string }[];
  entities: string[];
}): Article {
  return {
    id: raw.id,
    title: raw.rawArticle.title,
    source: raw.rawArticle.source,
    publishedAt: raw.rawArticle.publishedAt.toISOString(),
    contentSnippet: raw.rawArticle.contentSnippet || "",
    extractedContent: raw.rawArticle.extractedContent,
    biasNote: raw.biasNote,
    eventRegion: raw.eventRegion,
    sentimentScore: raw.sentimentScore,
    url: raw.rawArticle.url,
    categories: raw.categories,
    entities: raw.entities,
    sourceCountry: raw.rawArticle.sourceCountry,
    sourceOrigin: getPublisherRegion(raw.rawArticle.sourceCountry),
    sourceType: raw.rawArticle.sourceType,
    biasGroup: raw.rawArticle.biasGroup,
    coverageScope: raw.rawArticle.coverageScope,
    slug: raw.rawArticle.slug,
  };
}

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
  page = 0,
  enabledSources,
  hiddenCategories,
}: getArticlesParams): Promise<{
  articles: Article[];
  nextCursor: string | null;
}> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  const words = search.trim().split(/\s+/).filter(Boolean);

  // ── SEARCH PATH: hybrid vector + tsvector, or tsvector-only for short queries ──
  if (words.length > 0) {
    try {
      const offset = page * TAKE;
      const searchText = search.trim();
      const isShortQuery = words.length < 3;

      let scoredIds: Array<{ id: string }>;

      if (isShortQuery) {
        // tsvector-only for short queries (<3 words)
        scoredIds = await prisma.$queryRaw`
          SELECT p.id
          FROM "ProcessedArticle" p
          JOIN "RawArticle" r ON p."rawArticleId" = r.id
          WHERE p."clusterStatus" != 'SKIPPED'
            AND to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", ''))
              @@ plainto_tsquery('english', ${searchText})
          ORDER BY ts_rank_cd(
            to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", '')),
            plainto_tsquery('english', ${searchText})
          ) DESC, p.id ASC
          LIMIT ${TAKE + 1}
          OFFSET ${offset}
        ` as Array<{ id: string }>;
      } else {
        // Hybrid: vector + tsvector for longer queries
        let queryEmbedding: number[] | null = null;
        try {
          queryEmbedding = await generateQueryEmbedding(searchText);
        } catch (embErr) {
          console.error("Embedding API failed, falling back to tsvector-only:", embErr);
        }

        if (queryEmbedding) {
          scoredIds = await prisma.$queryRaw`
            WITH semantic AS (
              SELECT p.id, 1.0 / (1.0 + (p.embedding <=> ${queryEmbedding}::vector)) AS score
              FROM "ProcessedArticle" p
              JOIN "RawArticle" r ON p."rawArticleId" = r.id
              WHERE p.embedding IS NOT NULL
                AND p."clusterStatus" != 'SKIPPED'
              ORDER BY p.embedding <=> ${queryEmbedding}::vector
              LIMIT 50
            ),
            keyword AS (
              SELECT p.id, ts_rank_cd(
                to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", '')),
                plainto_tsquery('english', ${searchText})
              ) AS score
              FROM "ProcessedArticle" p
              JOIN "RawArticle" r ON p."rawArticleId" = r.id
              WHERE to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", ''))
                @@ plainto_tsquery('english', ${searchText})
                AND p."clusterStatus" != 'SKIPPED'
              ORDER BY score DESC
              LIMIT 50
            )
            SELECT COALESCE(s.id, k.id) AS id
            FROM semantic s FULL JOIN keyword k USING (id)
            ORDER BY
              (COALESCE(s.score * 0.7, 0) + COALESCE(k.score * 0.3, 0)) DESC,
              COALESCE(s.id, k.id) ASC
            LIMIT ${TAKE + 1}
            OFFSET ${offset}
          ` as Array<{ id: string }>;
        } else {
          // Fallback: tsvector-only
          scoredIds = await prisma.$queryRaw`
            SELECT p.id
            FROM "ProcessedArticle" p
            JOIN "RawArticle" r ON p."rawArticleId" = r.id
            WHERE p."clusterStatus" != 'SKIPPED'
              AND to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", ''))
                @@ plainto_tsquery('english', ${searchText})
            ORDER BY ts_rank_cd(
              to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r."contentSnippet", '')),
              plainto_tsquery('english', ${searchText})
            ) DESC, p.id ASC
            LIMIT ${TAKE + 1}
            OFFSET ${offset}
          ` as Array<{ id: string }>;
        }
      }

      const ids = scoredIds.map(r => r.id);
      if (ids.length === 0) {
        return { articles: [], nextCursor: null };
      }

      // Fetch full article data with includes (applies remaining filters)
      const rawArticles = await prisma.processedArticle.findMany({
        where: { id: { in: ids } },
        include: { rawArticle: true, categories: true },
      });

      // Reorder to match the scored order
      const idOrder = new Map(ids.map((id, i) => [id, i]));
      rawArticles.sort((a, b) => (idOrder.get(a.id) ?? Infinity) - (idOrder.get(b.id) ?? Infinity));

      const hasMore = rawArticles.length > TAKE;
      const trimmed = hasMore ? rawArticles.slice(0, TAKE) : rawArticles;

      return { articles: trimmed.map(mapArticle), nextCursor: hasMore ? String(page + 1) : null };
    } catch (error) {
      console.log("searchArticles error, falling back to default sort:", error);
    }
  }

  // ── DEFAULT PATH (no search, or search query failed) ──
  try {
    const categoryFilter = category !== "all"
      ? [{ categories: { some: { name: category } } }]
      : [];

    let regionFilter: Record<string, unknown>[] = [];
    if (region && region !== "all") regionFilter = [{ eventRegion: region }];

    let originFilter: Record<string, unknown>[] = [];
    if (origin && origin !== "all") {
      const matchingCountries = Object.entries(COUNTRY_TO_REGION)
        .filter(([, regionVal]) => regionVal.toLowerCase() === origin.toLowerCase())
        .map(([country]) => country);
      originFilter = [{ rawArticle: { sourceCountry: { in: matchingCountries } } }];
    }

    let typeFilter: Record<string, unknown>[] = [];
    if (type && type !== "all") typeFilter = [{ rawArticle: { sourceType: type } }];

    let biasFilter: Record<string, unknown>[] = [];
    if (bias && bias !== "all") biasFilter = [{ rawArticle: { biasGroup: bias } }];

    let scopeFilter: Record<string, unknown>[] = [];
    if (scope && scope !== "all") scopeFilter = [{ rawArticle: { coverageScope: scope } }];

    let sourcesFilter: Record<string, unknown>[] = [];
    if (enabledSources) sourcesFilter = [{ rawArticle: { source: { in: enabledSources } } }];

    const storyFilter = story && story !== "all"
      ? [{ storyClusters: { some: { slug: story } } }]
      : [];

    const notSkippedFilter = [{ clusterStatus: { not: "SKIPPED" } }];

    const notHiddenFilter = hiddenCategories && hiddenCategories.length > 0
      ? [{ categories: { none: { name: { in: hiddenCategories } } } }]
      : [];

    const searchFilter = words.length > 0
      ? words.map((word) => ({
          OR: [
            { rawArticle: { title: { contains: word, mode: "insensitive" as const } } },
            { rawArticle: { contentSnippet: { contains: word, mode: "insensitive" as const } } },
            { rawArticle: { source: { contains: word, mode: "insensitive" as const } } },
          ],
        }))
      : [];

    const orderBy = sort === "bias"
      ? [{ sentimentScore: "desc" as const }, { id: "asc" as const }]
      : [{ rawArticle: { publishedAt: "desc" as const } }, { id: "asc" as const }];

    const raw = await prisma.processedArticle.findMany({
      take: TAKE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        AND: [
          ...categoryFilter,
          ...searchFilter,
          ...notSkippedFilter,
          ...notHiddenFilter,
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
      include: { rawArticle: true, categories: true },
    });

    const hasMore = raw.length > TAKE;
    const trimmed = hasMore ? raw.slice(0, TAKE) : raw;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

    return { articles: trimmed.map(mapArticle), nextCursor };
  } catch (error) {
    console.log("getArticles error:", error);
    return { articles: [], nextCursor: null };
  }
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

    return {
      id: raw.id,
      title: raw.rawArticle.title,
      source: raw.rawArticle.source,
      publishedAt: raw.rawArticle.publishedAt.toISOString(),
      contentSnippet: raw.rawArticle.contentSnippet || "",
      extractedContent: raw.rawArticle.extractedContent,
      biasNote: raw.biasNote,
      eventRegion: raw.eventRegion,
      sentimentScore: raw.sentimentScore,
      url: raw.rawArticle.url,
      categories: raw.categories,
      entities: raw.entities,
      sourceCountry: raw.rawArticle.sourceCountry,
      sourceOrigin: getPublisherRegion(raw.rawArticle.sourceCountry),
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
