/**
 * Unified RSS Scanner — handles both Google News and Custom RSS feeds.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

import fetchRSSStream from "../../sources/rss.js";

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
    // Google News RSS search query
    const encodedQuery = encodeURIComponent(topic.aiRefinedQuery || topic.displayName);
    return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
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
  const { limit = MAX_RESULTS } = options;
  const feedUrl = buildFeedUrl(topic, sourceConfig);

  if (!feedUrl) {
    console.warn(`⚠️ [rssScanner] Invalid source type for RSS scanner: ${sourceConfig.type}`);
    return [];
  }

  const sourceName = sourceConfig.type === "google_news" ? "Google News" : (sourceConfig.name || "Custom RSS");
  console.log(`🔍 [rssScanner] Scanning ${sourceName} for "${topic.displayName}"...`);

  const findings = [];
  let count = 0;

  try {
    for await (const item of fetchRSSStream(sourceName, "US", feedUrl)) {
      if (count >= limit) break;

      // Filter by sinceDate if this is an incremental scan
      if (topic.lastScannedAt && item.publishedAt) {
        const pubDate = new Date(item.publishedAt);
        const lastScan = new Date(topic.lastScannedAt);
        if (pubDate <= lastScan) {
           // Skip older articles. Since feeds are chronological, we could potentially break early here,
           // but keeping it simple and continuing allows for out-of-order items.
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

    console.log(`   📊 [rssScanner] Found ${findings.length} matches from ${sourceName}`);
  } catch (err) {
    console.error(`❌ [rssScanner] Failed to fetch feed for ${sourceName}:`, err.message);
  }

  return findings;
}
