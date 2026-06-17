/**
 * Reddit Scanner — queries Reddit RSS endpoints for specific subreddits, users, or global searches.
 *
 * Utilizes public RSS endpoints to bypass Cloudflare bot detection blocks, extracts
 * high-quality metadata using Cheerio, filters bots, handles rate limits,
 * and performs strict client-side AST query evaluation.
 */

import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { evaluateQuery } from "../utils/parseQuery.js";
import { formatSinceDate } from "../utils/formatSinceDate.js";

const MAX_RESULTS = 25;
const REDDIT_BOT_BLACKLIST = ["AutoModerator", "[deleted]", "reddit-bot"];

const parser = new Parser();

/**
 * Helper to fetch a URL with retry and exponential backoff for HTTP 429.
 */
async function fetchWithBackoff(url, options = {}, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay * Math.pow(2, i);
        console.warn(`⚠️ [redditScanner] Hit HTTP 429 Rate Limit. Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      const waitTime = delay * Math.pow(2, i);
      console.warn(`⚠️ [redditScanner] Fetch error: ${err.message}. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Fetch and parse a Reddit RSS URL.
 */
async function fetchAndParseRss(url) {
  try {
    const response = await fetchWithBackoff(url, {
      headers: {
        "User-Agent": "global-news-aggregator/1.0 (LockedTopics Reddit Monitor; contact: mainuddinmehedi@example.com)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      }
    });

    if (!response.ok) {
      console.error(`❌ [redditScanner] Failed to fetch ${url}: HTTP ${response.status} ${response.statusText}`);
      return [];
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    return feed.items || [];
  } catch (err) {
    console.error(`❌ [redditScanner] Error fetching/parsing ${url}:`, err.message);
    return [];
  }
}

/**
 * Scan Reddit for a locked topic.
 *
 * @param {object} topic - A LockedTopic record
 * @param {object} sourceConfig - The specific source to scan
 * @param {object} options
 * @param {number} options.limit - Max results to return
 * @returns {Array<object>} Normalized finding objects
 */
export async function scanReddit(topic, sourceConfig, options = {}) {
  const { limit = MAX_RESULTS } = options;

  let sourceName = "Reddit";
  let items = [];

  // Parse source URL to determine target RSS endpoint
  if (sourceConfig.url?.includes("/r/")) {
    const subreddit = sourceConfig.url.split("/r/")[1].split("/")[0];
    sourceName = `r/${subreddit}`;
    
    // Fetch raw feed + search feed with displayName + search feed with aiRefinedQuery
    const rawUrl = `https://www.reddit.com/r/${subreddit}/.rss`;
    const cleanSearchUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(topic.displayName)}&restrict_sr=on&sort=new`;
    
    const urlsToFetch = [
      { type: "raw", url: rawUrl },
      { type: `search (displayName: "${topic.displayName}")`, url: cleanSearchUrl }
    ];

    if (topic.aiRefinedQuery && topic.aiRefinedQuery !== topic.displayName) {
      const booleanSearchUrl = `https://www.reddit.com/r/${subreddit}/search.rss?q=${encodeURIComponent(topic.aiRefinedQuery)}&restrict_sr=on&sort=new`;
      urlsToFetch.push({ type: "search (booleanQuery)", url: booleanSearchUrl });
    }

    const allItems = [];
    for (const target of urlsToFetch) {
      console.log(`🔍 [redditScanner] Fetching ${target.type} for ${sourceName}: ${target.url}`);
      const fetchedItems = await fetchAndParseRss(target.url);
      allItems.push(...fetchedItems);
    }

    // Merge and deduplicate by link
    const seenLinks = new Set();
    for (const item of allItems) {
      if (!seenLinks.has(item.link)) {
        seenLinks.add(item.link);
        items.push(item);
      }
    }
  } else if (
    sourceConfig.url?.includes("/u/") ||
    sourceConfig.url?.includes("/user/")
  ) {
    const user = sourceConfig.url.split(/\/(?:u|user)\//)[1].split("/")[0];
    sourceName = `u/${user}`;
    const url = `https://www.reddit.com/user/${user}/submitted.rss?sort=new`;
    
    console.log(`🔍 [redditScanner] Fetching user submissions for ${sourceName}: ${url}`);
    items = await fetchAndParseRss(url);
  } else {
    sourceName = "Reddit Global Search";
    const cleanSearchUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(topic.displayName)}&sort=new`;
    
    const urlsToFetch = [
      { type: `global (displayName: "${topic.displayName}")`, url: cleanSearchUrl }
    ];

    if (topic.aiRefinedQuery && topic.aiRefinedQuery !== topic.displayName) {
      const booleanSearchUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(topic.aiRefinedQuery)}&sort=new`;
      urlsToFetch.push({ type: "global (booleanQuery)", url: booleanSearchUrl });
    }

    const allItems = [];
    for (const target of urlsToFetch) {
      console.log(`🔍 [redditScanner] Fetching ${target.type}: ${target.url}`);
      const fetchedItems = await fetchAndParseRss(target.url);
      allItems.push(...fetchedItems);
    }

    // Merge and deduplicate by link
    const seenLinks = new Set();
    for (const item of allItems) {
      if (!seenLinks.has(item.link)) {
        seenLinks.add(item.link);
        items.push(item);
      }
    }
  }

  const sinceDate = topic.lastScannedAt;
  let sinceStr = formatSinceDate(sinceDate);

  console.log(`🔍 [redditScanner] Scanning ${sourceName} for "${topic.displayName}"${sinceStr}...`);

  const findings = [];
  let skipped = 0;

  for (const item of items) {
    // 1. Author Filter / Bot Blacklist
    const authorRaw = item.author || "";
    const authorName = authorRaw.replace(/^\/u(?:ser)?\//, "") || "unknown";
    if (REDDIT_BOT_BLACKLIST.some(bot => authorName.toLowerCase() === bot.toLowerCase())) {
      skipped++;
      continue;
    }

    // 2. Date Filtering
    const pubDate = item.isoDate ? new Date(item.isoDate) : new Date();
    if (sinceDate) {
      const lastScan = new Date(sinceDate);
      if (pubDate <= lastScan) {
        skipped++;
        continue;
      }
    }

    // 3. Extract metadata and post content via Cheerio
    let isSelfPost = true;
    let externalUrl = null;
    let bodyText = "";
    let bodyHtml = "";

    const contentHtml = item.content || "";
    if (contentHtml) {
      const $ = cheerio.load(contentHtml);
      
      // Select the selftext markdown container
      const mdContainer = $("div.md");
      if (mdContainer.length > 0) {
        bodyHtml = mdContainer.html()?.trim() || "";
        
        // Extract plain text with newlines for block elements to preserve readability
        const blocks = [];
        mdContainer.find("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre").each((i, el) => {
          const t = $(el).text().trim();
          if (t) blocks.push(t);
        });
        bodyText = blocks.length > 0 ? blocks.join("\n\n") : mdContainer.text().trim();
      }

      // Check if it's a link post (contains a [link] anchor pointing to external domain)
      const linkAnchor = $("span a").filter((i, el) => $(el).text() === "[link]");
      if (linkAnchor.length > 0) {
        const href = linkAnchor.attr("href");
        if (href && !href.includes("reddit.com/r/") && !href.includes("reddit.com/user/")) {
          isSelfPost = false;
          externalUrl = href;
        }
      }
    }

    // Fallback: use split contentSnippet if cheerio did not yield bodyText
    if (isSelfPost && !bodyText && item.contentSnippet) {
      bodyText = item.contentSnippet.split(/\bsubmitted by\b/i)[0].trim();
      bodyHtml = `<p>${bodyText}</p>`;
    }

    // Clean title prefix if prepended in the feed
    const titleLower = item.title.toLowerCase().trim();
    if (bodyText.toLowerCase().startsWith(titleLower)) {
      bodyText = bodyText.slice(item.title.length).trim().replace(/^[:\-\s\n]+/, "");
    }
    
    if (bodyHtml) {
      const $body = cheerio.load(bodyHtml);
      const firstP = $body("p").first();
      if (firstP.length > 0) {
        const firstPText = firstP.text().toLowerCase().trim();
        if (firstPText === titleLower || firstPText.startsWith(titleLower)) {
          if (firstPText === titleLower) {
            firstP.remove();
          } else {
            const cleanText = firstP.text().slice(item.title.length).trim().replace(/^[:\-\s\n]+/, "");
            firstP.text(cleanText);
          }
          bodyHtml = $body("body").html()?.trim() || bodyHtml;
        }
      }
    }

    // 4. Local Boolean AST query evaluation
    const textToSearch = `${item.title} ${bodyText}`;
    const isMatch = evaluateQuery(topic, textToSearch);

    if (!isMatch) {
      skipped++;
      continue;
    }

    // Determine clean subreddit name from post URL
    const subMatch = item.link.match(/\/r\/([^/]+)/);
    const subreddit = subMatch ? `r/${subMatch[1]}` : sourceName;

    findings.push({
      title: item.title,
      sourceUrl: item.link,
      sourceName: `Reddit (${subreddit})`,
      summary: bodyText ? (bodyText.slice(0, 300) + (bodyText.length > 300 ? "..." : "")) : "Reddit post.",
      rawArticleId: null,
      sourceType: "REDDIT",
      metadata: {
        author: authorName,
        subreddit: subreddit,
        isSelfPost,
        externalUrl,
        commentsUrl: item.link,
        contentHtml: bodyHtml || null,
      }
    });

    if (findings.length >= limit) {
      break;
    }
  }

  console.log(`   📊 [redditScanner] Found ${findings.length} new matches from ${sourceName} (${skipped} skipped as old/irrelevant/bot)`);

  return findings;
}
