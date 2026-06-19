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

  const baseWhere = getPrismaWhere(topic);
  if (Object.keys(baseWhere).length === 0 && (!topic.aiRefinedQuery && !topic.displayName)) {
    console.warn(
      `⚠️ [internalDb] No valid search terms for topic "${topic.displayName}"`,
    );
    return { findings: [], metadata: {} };
  }

  // Build AND conditions immutably instead of mutating the base where object
  const andConditions = [
    { clusterStatus: { not: "SKIPPED" } },
  ];

  const sinceDate = fullScan ? null : topic.lastScannedAt;

  if (sinceDate) {
    andConditions.push({
      rawArticle: {
        publishedAt: { gt: sinceDate },
      },
    });
  }

  // Compose final where clause without mutation
  const existingAnd = Array.isArray(baseWhere.AND)
    ? baseWhere.AND
    : baseWhere.AND
      ? [baseWhere.AND]
      : [];

  const where = {
    ...baseWhere,
    AND: [...existingAnd, ...andConditions],
  };

  let sinceStr = formatSinceDate(sinceDate);

  console.log(
    `🔍 [internalDb] Scanning for "${topic.displayName}"${sinceStr}`,
  );

  const matches = await prisma.processedArticle.findMany({
    where,
    include: {
      rawArticle: {
        select: {
          title: true,
          url: true,
          source: true,
          contentSnippet: true,
          publishedAt: true,
        },
      },
    },
    orderBy: { rawArticle: { publishedAt: "desc" } },
    take: limit,
  });

  console.log(
    `   📊 [internalDb] Found ${matches.length} potential matches for "${topic.displayName}"`,
  );

  // Normalize to the common finding shape used across all scanners
  const findings = matches.map((pa) => ({
    title: pa.rawArticle.title,
    sourceUrl: pa.rawArticle.url,
    sourceName: pa.rawArticle.source,
    summary: pa.rawArticle.contentSnippet?.slice(0, 500) || null,
    rawArticleId: pa.id,
    sourceType: "ARTICLE",
  }));

  return { findings, metadata: {} };
}

// Export for unit testing / direct usage
export { getPrismaWhere };

