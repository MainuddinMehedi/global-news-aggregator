/**
 * Internal DB Scanner — scans ProcessedArticle table for locked topic matches.
 *
 * Used by:
 *   1. processTopics.js (scheduled workflow — every 2h)
 *   2. The scan route ports this same logic for on-demand scans at topic creation.
 *
 * Input:  A LockedTopic object
 * Output: Array of normalized findings (before dedup/scoring)
 */

import { prisma } from "../../db/prisma.js";
import { getPrismaWhere } from "../utils/parseQuery.js";

const MAX_RESULTS = 200;

// Removed buildWhereClause

/**
 * Scan the internal ProcessedArticle table for a single locked topic.
 *
 * @param {object} topic - A LockedTopic record from the DB
 * @param {object} options
 * @param {boolean} options.fullScan - If true, ignores lastScannedAt and scans everything.
 *                                     Used for initial scan on topic creation.
 * @param {number}  options.limit    - Max results to return (default: 200)
 * @returns {Array<object>} Normalized finding objects ready for dedup + insert
 */
export async function scanInternalDb(topic, options = {}) {
  const { fullScan = false, limit = MAX_RESULTS } = options;

  const where = getPrismaWhere(topic);
  if (Object.keys(where).length === 0 && (!topic.aiRefinedQuery && !topic.displayName)) {
    console.warn(
      `⚠️ [internalDb] No valid search terms for topic "${topic.displayName}"`,
    );
    return [];
  }

  // Exclude SKIPPED articles from matching topics
  if (!where.AND) {
    where.AND = [];
  } else if (!Array.isArray(where.AND)) {
    where.AND = [where.AND];
  }
  where.AND.push({
    clusterStatus: { not: "SKIPPED" },
  });

  const sinceDate = fullScan ? null : topic.lastScannedAt;

  // If sinceDate is set, only scan articles newer than that
  if (sinceDate) {
    if (!where.AND) {
       where.AND = [];
    }
    where.AND.push({
      rawArticle: {
        publishedAt: { gt: sinceDate },
      }
    });
  }

  let sinceStr = " (full scan)";
  if (sinceDate) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    sinceStr = `, since ${sinceDate.getDate()} ${months[sinceDate.getMonth()]}, ${sinceDate.getFullYear()}`;
  }

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
  return matches.map((pa) => ({
    title: pa.rawArticle.title,
    sourceUrl: pa.rawArticle.url,
    sourceName: pa.rawArticle.source,
    summary: pa.rawArticle.contentSnippet?.slice(0, 500) || null,
    rawArticleId: pa.id,
    sourceType: "ARTICLE",
  }));
}

// Export for unit testing / direct usage
export { getPrismaWhere };
