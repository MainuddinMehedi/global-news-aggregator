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
import { parseQuery } from "../utils/parseQuery.js";

const MAX_RESULTS = 200;

/**
 * Build a Prisma WHERE clause from parsed query groups.
 *
 * Each group produces an AND condition (all terms in the group must appear
 * in either title or contentSnippet). Groups are OR'd together.
 */
function buildWhereClause(groups, sinceDate) {
  if (groups.length === 0) return null;

  const groupConditions = groups.map((terms) => ({
    AND: terms.map((term) => ({
      OR: [
        { rawArticle: { title: { contains: term, mode: "insensitive" } } },
        {
          rawArticle: {
            contentSnippet: { contains: term, mode: "insensitive" },
          },
        },
      ],
    })),
  }));

  const where = {
    OR: groupConditions,
  };

  // If sinceDate is set, only scan articles newer than that
  // If null (initial scan), search the entire DB
  if (sinceDate) {
    where.rawArticle = {
      publishedAt: { gt: sinceDate },
    };
  }

  return where;
}

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

  const groups = parseQuery(topic);

  if (groups.length === 0) {
    console.warn(
      `⚠️ [internalDb] No valid search terms for topic "${topic.displayName}"`,
    );
    return [];
  }

  const sinceDate = fullScan ? null : topic.lastScannedAt;

  const where = buildWhereClause(groups, sinceDate);
  if (!where) return [];

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
    `🔍 [internalDb] Scanning for "${topic.displayName}" — ${groups.length} term group(s)${sinceStr}`,
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
export { buildWhereClause };
