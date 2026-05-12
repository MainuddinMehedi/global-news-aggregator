/**
 * Webpage Diff Scanner — monitors specific URLs for content changes.
 *
 * This scanner fetches a webpage, extracts the main text content,
 * compares it against a stored hash to detect changes, and
 * checks the new content against the topic's query.
 */

/** TODO:
 * Later sometimes improvise this to get a specific information from the page.
 * Probably user is looking for something very specific. So make the discovery specific too.
 * You'll only know what to do here when you have used the current flow or actually looked for something and went on to use this system.
 */

import * as cheerio from "cheerio";
import hashSnippet from "../../utils/hashSnippet.js";
import { prisma } from "../../db/prisma.js";

const USER_AGENT = "global-news-aggregator/1.0 (LockedTopics Webpage Monitor)";

/**
 * Extracts the "meaningful" text from a webpage, ignoring common boilerplate.
 */
function extractCleanText(html) {
  const $ = cheerio.load(html);

  // Remove common boilerplate elements
  $(
    "script, style, nav, footer, header, noscript, iframe, .ads, .sidebar, #comments",
  ).remove();

  // Get text, collapse whitespace
  return $("body").text().replace(/\s+/g, " ").trim();
}

/**
 * Scan a specific webpage for changes and topic relevance.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - The specific source config { type: 'webpage', url, lastSeenHash, label }
 * @param {object} options
 * @returns {Array<object>} Normalized findings
 */
export async function scanWebpage(topic, sourceConfig, options = {}) {
  const { url, label } = sourceConfig;
  const sourceName = label || "Webpage Monitor";

  console.log(`🔍 [webpageScanner] Checking "${sourceName}" at ${url}...`);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const cleanText = extractCleanText(html);
    const newHash = hashSnippet(cleanText);

    // 1. Check if content has changed since last scan
    if (sourceConfig.lastSeenHash && sourceConfig.lastSeenHash === newHash) {
      console.log(`   ⚪ [webpageScanner] No changes detected for ${url}.`);
      return [];
    }

    console.log(
      `   ✨ [webpageScanner] Change detected! Analyzing content for relevance...`,
    );

    // 2. Update the hash in the topic's source config immediately to prevent repeat alerts
    // We update the JSON blob by mapping over sources
    const updatedSources = topic.sources.map((s) => {
      if (s.url === url && s.type === "webpage") {
        return { ...s, lastSeenHash: newHash };
      }
      return s;
    });

    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data: { sources: updatedSources },
    });

    // 3. Simple Keyword Relevance Check
    const contentLower = cleanText.toLowerCase();
    const queryTerms = (topic.aiRefinedQuery || topic.displayName)
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const matches = queryTerms.every((term) => contentLower.includes(term));

    if (!matches) {
      console.log(
        `   ⚪ [webpageScanner] Page changed, but doesn't match query terms.`,
      );
      return [];
    }

    // 4. Return as a finding
    // For a webpage, the "title" is often the <title> tag or the provided label
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().trim() || sourceName;

    return [
      {
        title: `[Update] ${pageTitle}`,
        sourceUrl: url,
        sourceName: sourceName,
        summary: cleanText.slice(0, 400) + "...",
        rawArticleId: null,
        sourceType: "WEBPAGE",
      },
    ];
  } catch (err) {
    console.error(`❌ [webpageScanner] Failed to fetch ${url}:`, err.message);
    return [];
  }
}
