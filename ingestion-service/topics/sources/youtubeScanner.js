/**
 * YouTube Scanner — monitors specific channels for new videos.
 *
 * This scanner uses YouTube's RSS feed feature to fetch the latest videos
 * from a channel, checks for newness, and filters by topic keywords.
 */

import fetchRSSStream from "../../sources/rss.js";

const MAX_RESULTS = 15;

/**
 * Extracts the YouTube Channel ID from various URL formats.
 * e.g., "https://www.youtube.com/channel/UC... " -> UC...
 * e.g., "https://www.youtube.com/user/username" -> Requires conversion (handled via RSS lookup)
 */
function getRssUrl(url) {
  // If it's already a channel ID link
  if (url.includes("/channel/")) {
    const channelId = url.split("/channel/")[1].split("/")[0].split("?")[0];
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  // If it's a handle (@username), we try the handle URL which often works with RSS
  if (url.includes("/@")) {
    const handle = url.split("/@")[1].split("/")[0].split("?")[0];
    // Note: YouTube RSS doesn't directly support handles well in the URL,
    // but some third-party tools or direct lookups are usually needed.
    // For now, we assume the user provides a /channel/ URL or we provide a warning.
    console.warn(`⚠️ [youtubeScanner] Handle-based URLs (@${handle}) are not directly supported by YouTube RSS. Please use a /channel/ID URL.`);
  }

  return null;
}

/**
 * Scan a YouTube channel for new videos.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - { type: 'youtube', url, label }
 * @param {object} options
 * @returns {Array<object>} Normalized findings
 */
export async function scanYoutube(topic, sourceConfig, options = {}) {
  const { url, label } = sourceConfig;
  const feedUrl = getRssUrl(url);

  if (!feedUrl) {
    console.warn(`⚠️ [youtubeScanner] Could not determine RSS feed for YouTube URL: ${url}`);
    return [];
  }

  const sourceName = label || 'YouTube Channel';
  console.log(`🔍 [youtubeScanner] Checking YouTube channel: ${sourceName}...`);

  const findings = [];
  let count = 0;

  try {
    const lastScan = topic.lastScannedAt ? new Date(topic.lastScannedAt) : new Date(0);

    for await (const item of fetchRSSStream(sourceName, "US", feedUrl)) {
      if (count >= MAX_RESULTS) break;

      const pubDate = new Date(item.publishedAt);

      // 1. Newness Check
      if (pubDate <= lastScan) continue;

      // 2. Relevance Check (Query terms in title or snippet)
      const content = (
        (item.title || "") +
        " " +
        (item.contentSnippet || "")
      ).toLowerCase();

      const queryTerms = (topic.aiRefinedQuery || topic.displayName)
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 2);

      const isMatch = queryTerms.every(term => content.includes(term));

      if (isMatch) {
        findings.push({
          title: `[Video] ${item.title}`,
          sourceUrl: item.url,
          sourceName: sourceName,
          summary: item.contentSnippet?.slice(0, 500) || "No description provided.",
          rawArticleId: null,
          sourceType: 'RSS' // Using RSS enum since it's an RSS feed
        });
      }

      count++;
    }

    console.log(`   📊 [youtubeScanner] Found ${findings.length} new matching videos.`);
    return findings;

  } catch (err) {
    console.error(`❌ [youtubeScanner] Failed to fetch channel ${sourceName}:`, err.message);
    return [];
  }
}
