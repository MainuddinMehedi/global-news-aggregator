import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "@/lib/ai/embeddings";
import { mapArticle, RawArticleData } from "./mapper";

import { Article } from "@/types/article";

export async function executeSearchQuery(
  search: string,
  page: number,
  take: number
): Promise<{ articles: Article[]; nextCursor: string | null }> {
  const words = search.trim().split(/\s+/).filter(Boolean);
  const offset = page * take;
  const searchText = search.trim();
  const isShortQuery = words.length < 3;

  try {
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
        LIMIT ${take + 1}
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
          LIMIT ${take + 1}
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
          LIMIT ${take + 1}
          OFFSET ${offset}
        ` as Array<{ id: string }>;
      }
    }

    const ids = scoredIds.map((r) => r.id);
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
    rawArticles.sort(
      (a, b) => (idOrder.get(a.id) ?? Infinity) - (idOrder.get(b.id) ?? Infinity)
    );

    const hasMore = rawArticles.length > take;
    const trimmed = hasMore ? rawArticles.slice(0, take) : rawArticles;

    return {
      articles: trimmed.map((a) => mapArticle(a as unknown as RawArticleData)),
      nextCursor: hasMore ? String(page + 1) : null,
    };
  } catch (error) {
    console.log("searchArticles error, falling back to default sort:", error);
    throw error;
  }
}
