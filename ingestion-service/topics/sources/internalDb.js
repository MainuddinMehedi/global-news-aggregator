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

const MAX_RESULTS = 200;

/**
 * Parse an AI-refined query string into structured search conditions.
 *
 * Handles:
 *   - Quoted phrases: "exact match" → searched as a single unit
 *   - OR operator:    termA OR termB → either can match
 *   - Bare words:     filtered to 3+ chars, all must match within a group
 *
 * Returns an array of term-groups. A match occurs if ANY group fully matches
 * (i.e. groups are OR'd, terms within a group are AND'd).
 *
 * Example: `"iran nuclear" OR "israel defense"` → two groups, each with one phrase.
 * Example: `google AI hiring` → one group with three terms (all must match).
 */
function parseQuery(aiRefinedQuery) {
  if (!aiRefinedQuery || typeof aiRefinedQuery !== "string") return [];

  // Split by OR (case-insensitive, surrounded by spaces)
  const orSegments = aiRefinedQuery
    .split(/\s+OR\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const groups = [];

  for (const segment of orSegments) {
    const terms = [];

    // Extract quoted phrases first
    const quotedRegex = /"([^"]+)"/g;
    let match;
    let remainder = segment;

    while ((match = quotedRegex.exec(segment)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length > 0) {
        terms.push(phrase);
      }
      remainder = remainder.replace(match[0], " ");
    }

    // Remaining bare words — filter short ones (≤2 chars)
    const bareWords = remainder
      .split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 2);

    terms.push(...bareWords);

    if (terms.length > 0) {
      groups.push(terms);
    }
  }

  return groups;
}

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

  const groups = parseQuery(topic.aiRefinedQuery);

  if (groups.length === 0) {
    console.warn(
      `⚠️ [internalDb] No valid search terms for topic "${topic.displayName}"`,
    );
    return [];
  }

  const sinceDate = fullScan ? null : topic.lastScannedAt;

  const where = buildWhereClause(groups, sinceDate);
  if (!where) return [];

  console.log(
    `🔍 [internalDb] Scanning for "${topic.displayName}" — ${groups.length} term group(s)${sinceDate ? `, since ${sinceDate.toISOString()}` : " (full scan)"}`,
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
export { parseQuery, buildWhereClause };
