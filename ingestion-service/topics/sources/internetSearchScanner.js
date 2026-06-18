/**
 * Internet Search Scanner — Unified search engine with dual-driver architecture.
 *
 * Driver 1 (Default): DuckDuckGo HTML — 100% free, no API key required.
 * Driver 2 (Premium): Brave Search API — structured JSON, requires BRAVE_API_KEY.
 *
 * Use Cases:
 *   B) Broad Web Discovery: Searches open web for topics without specific sources.
 *   C) Target Site Search: Uses `site:domain` operator for focused domain queries.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

import * as cheerio from "cheerio";
import { evaluateQuery } from "../utils/parseQuery.js";
import { SCANNER_CONFIG } from "../scannerConfig.js";
import { scanBrave } from "./braveScanner.js";
import extractHostname from "../utils/extractHostname.js";

const MAX_RESULTS = SCANNER_CONFIG.maxResults.search;
const DDG_BASE_URL = "https://html.duckduckgo.com/html/";

/**
 * Scan the internet for a locked topic using DuckDuckGo (free) or Brave Search (premium fallback).
 *
 * @param {object} topic - A LockedTopic record
 * @param {object} sourceConfig - The specific source to scan (from topic.sources array)
 *   - sourceConfig.siteRestriction (optional): Domain to restrict search (e.g. "reddit.com/r/artificial")
 * @param {object} options
 * @param {number} options.limit - Max results to return
 * @returns {Array<object>} Normalized finding objects
 */
export async function scanInternetSearch(topic, sourceConfig, options = {}) {
  const { limit = MAX_RESULTS } = options;

  // Build the search query
  const baseQuery = topic.displayName || topic.aiRefinedQuery || "";
  const siteRestriction = sourceConfig.siteRestriction || "";
  const query = siteRestriction
    ? `site:${siteRestriction} ${baseQuery}`
    : baseQuery;

  console.log(
    `🔍 [searchScanner] Scanning DuckDuckGo for "${topic.displayName}"${siteRestriction ? ` (site:${siteRestriction})` : ""}...`,
  );

  let rawResults = await fetchDuckDuckGoResults(query, limit);

  // If DDG fails or returns 0 results, fallback to Brave
  if (rawResults.length === 0) {
    console.log(`   ⚪ [searchScanner] No results from DuckDuckGo. Falling back to Brave Search...`);
    const braveResult = await scanBrave(topic, sourceConfig, options);
    
    // Normalize source type to SEARCH
    if (braveResult && braveResult.findings) {
      braveResult.findings.forEach(f => f.sourceType = "SEARCH");
    }
    return braveResult;
  }

  // Deduplicate by URL
  const seenUrls = new Set();
  const deduped = [];
  for (const result of rawResults) {
    if (!seenUrls.has(result.url)) {
      seenUrls.add(result.url);
      deduped.push(result);
    }
  }

  // Relaxed keyword pre-filter using evaluateQuery
  const findings = [];
  let filtered = 0;

  for (const result of deduped) {
    // Filter by sinceDate if this is an incremental scan
    // DDG HTML results generally don't have reliable dates, so we let the deduplication 
    // handle new vs old.
    
    if (findings.length >= limit) break;

    const textToSearch = `${result.title} ${result.snippet || ""}`;
    const isMatch = evaluateQuery(topic, textToSearch);

    if (!isMatch) {
      filtered++;
      continue;
    }

    findings.push({
      title: result.title,
      sourceUrl: result.url,
      sourceName: result.source || "DuckDuckGo",
      summary: result.snippet?.slice(0, 500) || null,
      rawArticleId: null,
      sourceType: "SEARCH",
    });
  }

  console.log(
    `   📊 [searchScanner] Found ${findings.length} matches from DuckDuckGo (${filtered} filtered by keywords, ${deduped.length} total results)`,
  );

  // If after keyword filtering we have 0 findings, fallback to Brave
  if (findings.length === 0) {
    console.log(`   ⚪ [searchScanner] 0 matches after filtering DuckDuckGo. Falling back to Brave Search...`);
    const braveResult = await scanBrave(topic, sourceConfig, options);
    
    if (braveResult && braveResult.findings) {
      braveResult.findings.forEach(f => f.sourceType = "SEARCH");
    }
    return braveResult;
  }

  return { findings, metadata: {} };
}

/**
 * Fetch search results from DuckDuckGo HTML endpoint.
 * Completely free, no API key required, no rate limits.
 */
async function fetchDuckDuckGoResults(query, limit) {
  try {
    const response = await fetch(DDG_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      body: `q=${encodeURIComponent(query)}&b=`,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `❌ [searchScanner] DuckDuckGo returned HTTP ${response.status}`,
      );
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results = [];

    $(".result__body, .results .result").each((i, el) => {
      if (results.length >= limit) return false;

      const $el = $(el);

      // Title and URL
      const titleEl = $el.find(".result__a");
      const title = titleEl.text().trim();
      let url = titleEl.attr("href") || "";

      // DuckDuckGo wraps URLs in a redirect — extract the actual URL
      if (url.includes("uddg=")) {
        try {
          const parsed = new URL(url, "https://duckduckgo.com");
          url = decodeURIComponent(parsed.searchParams.get("uddg") || url);
        } catch {
          // Keep the original URL if parsing fails
        }
      }

      // Snippet
      const snippet =
        $el.find(".result__snippet").text().trim() ||
        $el.find(".result__body .result__snippet").text().trim();

      // Source hostname
      const sourceUrl = $el.find(".result__url").text().trim();

      if (title && url && !url.startsWith("/")) {
        results.push({
          title,
          url,
          snippet,
          source: sourceUrl || extractHostname(url),
        });
      }
    });

    return results;
  } catch (err) {
    console.error(
      `❌ [searchScanner] DuckDuckGo fetch failed:`,
      err.message,
    );
    return [];
  }
}

