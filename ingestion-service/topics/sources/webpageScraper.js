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
import crypto from "crypto";
import { evaluateQuery } from "../utils/parseQuery.js";
import { extractCleanText } from "../utils/extractCleanText.js";
import hashSnippet from "../../utils/hashSnippet.js";

const USER_AGENT = "global-news-aggregator/1.0 (LockedTopics Webpage Monitor)";

/**
 * Extracts the "meaningful" text from a webpage, ignoring common boilerplate.
 */

/**
 * Scan a specific webpage for changes and topic relevance.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - The specific source config { type: 'webpage', url, lastSeenHash, label }
 * @param {object} options
 * @returns {object} { findings: Array, metadata: object }
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
      return { findings: [], metadata: {} };
    }

    console.log(
      `   ✨ [webpageScanner] Change detected! Analyzing content for relevance...`,
    );

    // 2. Simple Keyword Relevance Check
    const contentLower = cleanText;
    const matches = evaluateQuery(topic, contentLower);

    if (!matches) {
      console.log(
        `   ⚪ [webpageScanner] Page changed, but doesn't match query terms.`,
      );
      // We still update the hash to acknowledge we've seen this change
      return { findings: [], metadata: { newHash, url } };
    }

    // 3. Return as a finding
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().trim() || sourceName;

    return {
      findings: [
        {
          title: `[Update] ${pageTitle}`,
          sourceUrl: url,
          sourceName: sourceName,
          summary: cleanText.slice(0, 400) + "...",
          rawArticleId: null,
          sourceType: "WEBPAGE",
        },
      ],
      metadata: { newHash, url },
    };
  } catch (err) {
    console.error(`❌ [webpageScanner] Failed to fetch ${url}:`, err.message);
    // TODO(notification): User - Monitored page repeatedly unreachable → topic detail stale source indicator
    return { findings: [], metadata: {} };
  }
}
