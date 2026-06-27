/**
 * Internal DB Scanner — scans ProcessedArticle table for locked topic matches.
 *
 * Used by:
 *   1. scanTopics.js (scheduled workflow — every 2h)
 *   2. The scan route ports this same logic for on-demand scans at topic creation.
 *
 * Input:  A LockedTopic object
 * Output: { findings: Array, metadata: {} }
 */

import { prisma } from "../../db/prisma.js";
import { Prisma } from "@news/db";
import { getPrismaWhere } from "../utils/parseQuery.js";
import { formatSinceDate } from "../utils/formatSinceDate.js";
import { SCANNER_CONFIG } from "../scannerConfig.js";

/**
 * Scan the internal ProcessedArticle table for a single locked topic.
 *
 * @param {object} topic - A LockedTopic record from the DB
 * @param {object} options
 * @param {boolean} options.fullScan - If true, ignores lastScannedAt and scans everything.
 *                                     Used for initial scan on topic creation.
 * @param {number}  options.limit    - Max results to return
 * @returns {{ findings: Array<object>, metadata: object }}
 */
export async function scanInternalDb(topic, options = {}) {
  const { fullScan = false, limit = SCANNER_CONFIG.maxResults.internalDb } = options;
  const sinceDate = fullScan ? null : topic.lastScannedAt;
  let sinceStr = formatSinceDate(sinceDate);

  console.log(
    `🔍 [internalDb] Scanning for "${topic.displayName}"${sinceStr}`,
  );

  let vectorFindings = [];
  
  if (topic.queryEmbedding) {
    try {
      // 1. Vector Search Path
      const dateCondition = sinceDate ? Prisma.sql`AND r."publishedAt" > ${sinceDate}` : Prisma.empty;
      
      const vectorMatches = await prisma.$queryRaw`
        SELECT 
          p.id, 
          r.title,
          r.url as "sourceUrl",
          r.source as "sourceName",
          r."contentSnippet" as "summary"
        FROM "ProcessedArticle" p
        JOIN "RawArticle" r ON p."rawArticleId" = r.id
        WHERE p.embedding IS NOT NULL
          AND p."clusterStatus" != 'SKIPPED'
          AND p.embedding <=> ${topic.queryEmbedding}::vector < ${SCANNER_CONFIG.maxVectorDistance}
          ${dateCondition}
        ORDER BY p.embedding <=> ${topic.queryEmbedding}::vector ASC
        LIMIT ${limit}
      `;

      vectorFindings = vectorMatches.map(m => ({
        title: m.title,
        sourceUrl: m.sourceUrl,
        sourceName: m.sourceName,
        summary: m.summary?.slice(0, 500) || null,
        rawArticleId: m.id,
        sourceType: "ARTICLE",
        _isVectorMatch: true
      }));
    } catch (err) {
      console.error(`⚠️ [internalDb] Vector query failed for "${topic.displayName}", falling back to keyword only.`, err);
    }
  }

  // 2. Legacy Keyword Search Path
  const baseWhere = getPrismaWhere(topic);
  let keywordFindings = [];

  if (Object.keys(baseWhere).length > 0 || topic.aiRefinedQuery || topic.displayName) {
    const andConditions = [{ clusterStatus: { not: "SKIPPED" } }];
    if (sinceDate) {
      andConditions.push({ rawArticle: { publishedAt: { gt: sinceDate } } });
    }

    const existingAnd = Array.isArray(baseWhere.AND)
      ? baseWhere.AND
      : baseWhere.AND ? [baseWhere.AND] : [];

    const where = { ...baseWhere, AND: [...existingAnd, ...andConditions] };

    const keywordMatches = await prisma.processedArticle.findMany({
      where,
      include: {
        rawArticle: {
          select: { title: true, url: true, source: true, contentSnippet: true, publishedAt: true },
        },
      },
      orderBy: { rawArticle: { publishedAt: "desc" } },
      take: limit,
    });

    keywordFindings = keywordMatches.map((pa) => ({
      title: pa.rawArticle.title,
      sourceUrl: pa.rawArticle.url,
      sourceName: pa.rawArticle.source,
      summary: pa.rawArticle.contentSnippet?.slice(0, 500) || null,
      rawArticleId: pa.id,
      sourceType: "ARTICLE",
    }));
  }

  // 3. Merge Strategies
  // Prioritize vector results, then append keyword results, deduplicating by rawArticleId
  const findingsMap = new Map();
  
  for (const f of vectorFindings) {
    findingsMap.set(f.rawArticleId, f);
  }
  
  for (const f of keywordFindings) {
    if (!findingsMap.has(f.rawArticleId)) {
      findingsMap.set(f.rawArticleId, f);
    }
  }

  // Convert map to array and apply limit
  const finalFindings = Array.from(findingsMap.values()).slice(0, limit);

  // Clean up temporary tracking flags
  for (const f of finalFindings) {
    delete f._isVectorMatch;
  }

  if (finalFindings.length === 0 && (!topic.aiRefinedQuery && !topic.displayName)) {
    console.warn(`⚠️ [internalDb] No valid search terms for topic "${topic.displayName}"`);
  }

  console.log(
    `   📊 [internalDb] Found ${finalFindings.length} matches (Vector: ${vectorFindings.length}, Keyword: ${keywordFindings.length}) for "${topic.displayName}"`,
  );

  return { findings: finalFindings, metadata: {} };
}

// Export for unit testing / direct usage
export { getPrismaWhere };

