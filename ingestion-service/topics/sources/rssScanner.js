/**
 * Unified RSS Scanner — handles both Google News and Custom RSS feeds.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

import fetchRSSStream from "../../sources/rss.js";
import { parseQuery } from "./internalDb.js";

const MAX_RESULTS = 100;

/**
 * Build the appropriate RSS URL based on the source config type.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - The source configuration from topic.sources
 * @returns {string|null} The RSS feed URL
 */
function buildFeedUrl(topic, sourceConfig) {
  if (sourceConfig.type === "google_news") {
    // Google News RSS search query without specific country restrictions
    const encodedQuery = encodeURIComponent(
      topic.aiRefinedQuery || topic.displayName,
    );
    return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en`;
  }

  if (sourceConfig.type === "rss") {
    // User-provided direct RSS URL
    return sourceConfig.url;
  }

  return null;
}

/**
 * Scan an RSS feed for a locked topic.
 *
 * @param {object} topic - A LockedTopic record
 * @param {object} sourceConfig - The specific source to scan (from topic.sources array)
 * @param {object} options
 * @param {number} options.limit - Max results to return
 * @returns {Array<object>} Normalized finding objects
 */
export async function scanRss(topic, sourceConfig, options = {}) {
  const { limit = MAX_RESULTS, fullScan = false } = options;
  const feedUrl = buildFeedUrl(topic, sourceConfig);

  if (!feedUrl) {
    console.warn(
      `⚠️ [rssScanner] Invalid source type for RSS scanner: ${sourceConfig.type}`,
    );
    return [];
  }

  const sourceName =
    sourceConfig.type === "google_news"
      ? "Google News"
      : sourceConfig.name || "Custom RSS";

  const sinceDate = fullScan ? null : topic.lastScannedAt;
  let sinceStr = fullScan ? " (full scan)" : "";
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
    `🔍 [rssScanner] Scanning ${sourceName} for "${topic.displayName}"${sinceStr}...`,
  );

  const findings = [];
  let count = 0;
  let skipped = 0;
  let keywordFiltered = 0;

  const queryGroups =
    sourceConfig.type === "rss" ? parseQuery(topic.aiRefinedQuery) : [];

  try {
    for await (const item of fetchRSSStream(sourceName, null, feedUrl)) {
      if (count >= limit) break;

      // 1. Filter by sinceDate if this is an incremental scan
      if (!fullScan && sinceDate && item.publishedAt) {
        const pubDate = new Date(item.publishedAt);
        const lastScan = new Date(sinceDate);
        if (pubDate <= lastScan) {
          // Skip older articles
          skipped++;
          continue;
        }
      }

      // 2. Keyword Pre-filtering for Custom RSS
      if (sourceConfig.type === "rss" && queryGroups.length > 0) {
        const textToSearch =
          `${item.title} ${item.contentSnippet || ""}`.toLowerCase();
        const matchesKeywords = queryGroups.some((group) =>
          group.every((term) => textToSearch.includes(term.toLowerCase())),
        );

        if (!matchesKeywords) {
          keywordFiltered++;
          continue;
        }
      }

      findings.push({
        title: item.title,
        sourceUrl: item.url,
        sourceName: sourceName,
        summary: item.contentSnippet?.slice(0, 500) || null,
        rawArticleId: null, // External finding
        sourceType: sourceConfig.type === "google_news" ? "GOOGLE" : "RSS",
      });

      count++;
    }

    const filteredSuffix =
      keywordFiltered > 0 ? `, ${keywordFiltered} filtered by keywords` : "";
    console.log(
      `   📊 [rssScanner] Found ${findings.length} new matches from ${sourceName} (${skipped} skipped as old/duplicate${filteredSuffix})`,
    );
  } catch (err) {
    console.error(
      `❌ [rssScanner] Failed to fetch feed for ${sourceName}:`,
      err.message,
    );
  }

  return findings;
}
