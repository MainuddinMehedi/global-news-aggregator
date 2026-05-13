/**
 * Reddit Scanner — queries Reddit search endpoints for specific subreddits or users.
 *
 * Used by the scanner orchestrator for Locked Topics.
 */

const MAX_RESULTS = 25;

/**
 * Scan Reddit for a locked topic.
 *
 * @param {object} topic - A LockedTopic record
 * @param {object} sourceConfig - The specific source to scan (from topic.sources array)
 * @param {object} options
 * @param {number} options.limit - Max results to return
 * @returns {Array<object>} Normalized finding objects
 */
export async function scanReddit(topic, sourceConfig, options = {}) {
  const { limit = MAX_RESULTS } = options;

  let queryUrl = "";
  let sourceName = "Reddit";

  // The sourceConfig.url will likely look like:
  // "https://reddit.com/r/geopolitics" or "https://reddit.com/u/user1"
  if (sourceConfig.url?.includes("/r/")) {
    const subreddit = sourceConfig.url.split("/r/")[1].split("/")[0];
    sourceName = `r/${subreddit}`;
    queryUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(topic.aiRefinedQuery || topic.displayName)}&restrict_sr=on&sort=new&limit=${limit}`;
  } else if (
    sourceConfig.url?.includes("/u/") ||
    sourceConfig.url?.includes("/user/")
  ) {
    const user = sourceConfig.url.split(/\/(?:u|user)\//)[1].split("/")[0];
    sourceName = `u/${user}`;

    // User search is trickier, so we just get their new posts and filter locally
    queryUrl = `https://www.reddit.com/user/${user}/submitted.json?sort=new&limit=${limit}`;
  } else {
    // Global reddit search
    queryUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(topic.aiRefinedQuery || topic.displayName)}&sort=new&limit=${limit}`;
  }

  const sinceDate = topic.lastScannedAt;
  let sinceStr = "";
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
    `🔍 [redditScanner] Scanning ${sourceName} for "${topic.displayName}"${sinceStr}...`,
  );

  const findings = [];
  let skipped = 0;

  try {
    const response = await fetch(queryUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const posts = data.data?.children || [];

    for (const post of posts) {
      const item = post.data;

      // Filter by sinceDate if this is an incremental scan
      if (sinceDate && item.created_utc) {
        const pubDate = new Date(item.created_utc * 1000);
        const lastScan = new Date(sinceDate);

        if (pubDate <= lastScan) {
          skipped++;
          continue;
        }
      }

      // If we did a user submissions fetch, we need to manually filter by topic query
      if (sourceName.startsWith("u/")) {
        const content = (
          item.title +
          " " +
          (item.selftext || "")
        ).toLowerCase();
        const terms = (topic.aiRefinedQuery || topic.displayName)
          .toLowerCase()
          .split(" ")
          .filter((t) => t.length > 2);

        if (!terms.some((term) => content.includes(term))) {
          skipped++;
          continue; // Skip if no terms match
        }
      }

      findings.push({
        title: item.title,
        sourceUrl: `https://reddit.com${item.permalink}`,
        sourceName: `Reddit (${item.subreddit_name_prefixed})`,
        summary: item.selftext?.slice(0, 500) || null,
        rawArticleId: null, // External finding
        sourceType: "REDDIT",
      });
    }

    console.log(
      `   📊 [redditScanner] Found ${findings.length} new matches from ${sourceName} (${skipped} skipped as old/irrelevant)`,
    );
  } catch (err) {
    console.error(
      `❌ [redditScanner] Failed to fetch from ${sourceName}:`,
      err.message,
    );
  }

  return findings;
}
