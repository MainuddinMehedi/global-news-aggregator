/**
 * YouTube Scanner — monitors specific channels and discovers new videos using yt-search.
 *
 * This scanner supports:
 * 1. Direct channel monitoring via RSS (when URLs are provided).
 * 2. Broad discovery for a topic using yt-search.
 * 3. Channel prioritization (using names to refine an additional yt-search).
 */

import fetchRSSStream from "../../sources/rss.js";
import { evaluateQuery } from "../utils/parseQuery.js";
import ytSearch from "yt-search";

const MAX_RESULTS = 20;

/**
 * Resolves a YouTube handle URL to a Channel ID by fetching the page.
 */
async function resolveHandleToId(handleUrl) {
  try {
    const response = await fetch(handleUrl);
    if (!response.ok) return null;
    const html = await response.text();

    const patterns = [
      /property="og:url" content="[^"]+\/channel\/(UC[a-zA-Z0-9_-]{22})"/,
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /itemprop="identifier" content="(UC[a-zA-Z0-9_-]{22})"/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch (err) {
    console.warn(
      `⚠️ [youtubeScanner] Error resolving handle ${handleUrl}:`,
      err.message,
    );
    return null;
  }
}

/**
 * Extracts the YouTube Channel ID from a URL.
 */
async function getChannelRssUrl(url) {
  if (url.includes("/channel/")) {
    const channelId = url.split("/channel/")[1].split("/")[0].split("?")[0];
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  }

  if (url.includes("/@")) {
    const channelId = await resolveHandleToId(url);
    if (channelId) {
      return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    }
  }
  return null;
}

/**
 * Helper to scan a specific YouTube RSS feed (for latest uploads).
 */
async function scanChannelFeed(topic, feedUrl, sourceName, lastScan) {
  const findings = [];

  try {
    let count = 0;
    for await (const item of fetchRSSStream(sourceName, "US", feedUrl)) {
      if (count >= MAX_RESULTS) break;

      const pubDate = new Date(item.publishedAt);
      if (pubDate <= lastScan) continue;

      const content = `${item.title} ${item.contentSnippet || ""}`;
      const isMatch = evaluateQuery(topic, content);

      if (isMatch) {
        findings.push({
          title: `[Video] ${item.title}`,
          sourceUrl: item.url,
          sourceName: sourceName,
          summary:
            item.contentSnippet?.slice(0, 500) || "No description provided.",
          rawArticleId: null,
          sourceType: "RSS", // Sticking with RSS to match existing DB enum
        });
      }
      count++;
    }
  } catch (err) {
    console.error(
      `❌ [youtubeScanner] Feed error for ${sourceName}:`,
      err.message,
    );
  }
  return findings;
}

/**
 * Performs YouTube discovery search via yt-search.
 */
async function discoverYoutubeContent(topic, prioritizedNames, lastScan) {
  const findings = [];
  const baseQuery = topic.displayName || "";
  
  if (!baseQuery) return findings;

  // 1. Broad discovery for the topic
  // 2. Targeted discovery for prioritized channels
  const searchQueries = [baseQuery];

  for (const name of prioritizedNames) {
    searchQueries.push(`${name} ${baseQuery}`);
  }

  for (const query of searchQueries) {
    try {
      console.log(`   🔍 [youtubeScanner] Searching YouTube for: "${query}"...`);
      const searchResult = await ytSearch(query);
      const videos = searchResult.videos.slice(0, MAX_RESULTS);

      for (const video of videos) {
        // We filter through evaluateQuery to strictly apply the boolean logic
        const content = `${video.title} ${video.description || ""}`;
        const isMatch = evaluateQuery(topic, content);

        if (isMatch) {
          findings.push({
            title: `[Video] ${video.title}`,
            sourceUrl: video.url,
            sourceName: video.author?.name || "YouTube Discovery",
            summary:
              video.description?.slice(0, 500) ||
              "Discovered via yt-search.",
            rawArticleId: null,
            sourceType: "RSS", // Sticking with RSS to match existing DB enum
          });
        }
      }
    } catch (err) {
      console.error(`❌ [youtubeScanner] Discovery error for "${query}":`, err.message);
    }
  }
  return findings;
}

/**
 * Scan YouTube for a topic.
 */
export async function scanYoutube(topic, sourceConfig, options = {}) {
  const { url: rawInput, label } = sourceConfig;
  const lastScan = topic.lastScannedAt
    ? new Date(topic.lastScannedAt)
    : new Date(0);

  // Parse input into URLs and Names
  const parts = (rawInput || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const urls = [];
  const names = [];

  for (const part of parts) {
    try {
      new URL(part);
      if (part.includes("youtube.com") || part.includes("youtu.be")) {
        urls.push(part);
      }
    } catch {
      names.push(part);
    }
  }

  console.log(
    `🔍 [youtubeScanner] Scanning YouTube (URLs: ${urls.length}, Prioritized Names: ${names.length})...`,
  );

  const allFindings = [];

  // 1. Direct Channel Scans (For active monitoring of new uploads)
  for (const url of urls) {
    const feedUrl = await getChannelRssUrl(url);
    if (feedUrl) {
      const results = await scanChannelFeed(
        topic,
        feedUrl,
        label || "YouTube Channel",
        lastScan,
      );
      allFindings.push(...results);
    }
  }

  // 2. Discovery Scans (Broad + Prioritized using yt-search)
  const discoveryResults = await discoverYoutubeContent(topic, names, lastScan);
  allFindings.push(...discoveryResults);

  // 3. De-duplicate by URL
  const seenUrls = new Set();
  const uniqueFindings = allFindings.filter((f) => {
    if (seenUrls.has(f.sourceUrl)) return false;
    seenUrls.add(f.sourceUrl);
    return true;
  });

  console.log(
    `   📊 [youtubeScanner] Found ${uniqueFindings.length} unique videos.`,
  );
  return uniqueFindings;
}
