/**
 * Brave Search Scanner — queries the Brave Search News API.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

import { prisma } from "../../db/prisma.js";

const MAX_RESULTS = 20;

/**
 * Scan Brave Search for a locked topic.
 *
 * @param {object} topic - A LockedTopic record
 * @param {object} sourceConfig - The specific source to scan (from topic.sources array)
 * @param {object} options
 * @param {number} options.limit - Max results to return
 * @returns {Array<object>} Normalized finding objects
 */
export async function scanBrave(topic, sourceConfig, options = {}) {
  const { limit = MAX_RESULTS } = options;
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.warn(
      "⚠️ [braveScanner] BRAVE_API_KEY is not set. Skipping Brave search.",
    );
    return [];
  }

  const query = topic.aiRefinedQuery || topic.displayName;
  console.log(
    `🔍 [braveScanner] Scanning Brave News for "${topic.displayName}"...`,
  );

  const findings = [];

  // 1. Fetch AI Summary
  let liveWebSummary = null;
  try {
    const webResponse = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&summary=1`,
      {
        headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (webResponse.ok) {
      const webData = await webResponse.json();
      if (webData.summarizer && webData.summarizer.key) {
        const sumResponse = await fetch(
          `https://api.search.brave.com/res/v1/summarizer/search?key=${webData.summarizer.key}&entity_info=0`,
          {
            headers: {
              Accept: "application/json",
              "X-Subscription-Token": apiKey,
            },
            signal: AbortSignal.timeout(15000),
          },
        );
        if (sumResponse.ok) {
          const sumData = await sumResponse.json();
          if (
            sumData.summary &&
            sumData.summary.length > 0 &&
            sumData.summary[0].text
          ) {
            // Sometimes it returns an array of summary objects, we can join them or just take the first.
            liveWebSummary = sumData.summary.map((s) => s.text).join(" ");
          }
        }
      }
    }
  } catch (err) {
    console.error("⚠️ [braveScanner] Failed to fetch AI summary:", err.message);
  }

  if (liveWebSummary) {
    console.log(`   ✨ [braveScanner] Successfully retrieved AI summary.`);
    try {
      await prisma.lockedTopic.update({
        where: { id: topic.id },
        data: { liveWebSummary },
      });
    } catch (err) {
      console.error(
        "⚠️ [braveScanner] Failed to update topic with AI summary:",
        err.message,
      );
    }
  }

  // 2. Fetch News Findings
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    for (const item of results) {
      // Filter by sinceDate if this is an incremental scan
      if (topic.lastScannedAt && item.age) {
        const pubDate = new Date(item.age);
        const lastScan = new Date(topic.lastScannedAt);
        if (pubDate <= lastScan) {
          continue;
        }
      }

      findings.push({
        title: item.title,
        sourceUrl: item.url,
        sourceName: item.meta_url?.hostname || "Brave Search",
        summary: item.description?.slice(0, 500) || null,
        rawArticleId: null, // External finding
        sourceType: "BRAVE",
      });
    }

    console.log(
      `   📊 [braveScanner] Found ${findings.length} matches from Brave Search`,
    );
  } catch (err) {
    console.error(
      "❌ [braveScanner] Failed to fetch from Brave Search:",
      err.message,
    );
  }

  return findings;
}
