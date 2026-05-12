/**
 * Brave Search Scanner — queries the Brave Search News API.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

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
