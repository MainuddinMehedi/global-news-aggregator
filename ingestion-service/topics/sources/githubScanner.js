/**
 * GitHub Release Scanner — monitors specific repositories for new releases.
 *
 * This scanner uses the GitHub REST API to fetch releases,
 * checks if they are newer than the last scan, and filters
 * them based on the topic's query.
 */

const USER_AGENT = 'global-news-aggregator/1.0 (LockedTopics GitHub Monitor)';

/**
 * Extracts owner and repo from various GitHub URL formats.
 * e.g., "https://github.com/facebook/react" -> { owner: "facebook", repo: "react" }
 */
function parseGithubUrl(url) {
  try {
    const cleanUrl = url.replace(/\/$/, ""); // Remove trailing slash
    const parts = cleanUrl.split("/");
    const repo = parts.pop();
    const owner = parts.pop();

    if (!owner || !repo) return null;
    return { owner, repo };
  } catch (err) {
    return null;
  }
}

/**
 * Scan a GitHub repository for new releases.
 *
 * @param {object} topic - The LockedTopic record
 * @param {object} sourceConfig - { type: 'github', url, label }
 * @param {object} options
 * @returns {Array<object>} Normalized findings
 */
export async function scanGithub(topic, sourceConfig, options = {}) {
  const { url, label } = sourceConfig;
  const repoInfo = parseGithubUrl(url);

  if (!repoInfo) {
    console.warn(`⚠️ [githubScanner] Invalid GitHub URL: ${url}`);
    return [];
  }

  const sourceName = label || `${repoInfo.owner}/${repoInfo.repo}`;
  console.log(`🔍 [githubScanner] Checking GitHub releases for ${sourceName}...`);

  const headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/vnd.github.v3+json'
  };

  // Optional: Add GITHUB_TOKEN if available to increase rate limits
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases?per_page=5`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      if (response.status === 404) throw new Error("Repository not found or has no releases.");
      if (response.status === 403) throw new Error("GitHub API rate limit exceeded.");
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const releases = await response.json();
    const findings = [];

    const lastScan = topic.lastScannedAt ? new Date(topic.lastScannedAt) : new Date(0);

    for (const release of releases) {
      const pubDate = new Date(release.published_at || release.created_at);

      // 1. Newness Check
      if (pubDate <= lastScan) continue;

      // 2. Relevance Check (Query terms in title or body)
      const content = (
        (release.name || "") +
        " " +
        (release.tag_name || "") +
        " " +
        (release.body || "")
      ).toLowerCase();

      const queryTerms = (topic.aiRefinedQuery || topic.displayName)
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 2);

      const isMatch = queryTerms.every(term => content.includes(term));

      if (isMatch) {
        findings.push({
          title: `[Release] ${release.tag_name}${release.name ? `: ${release.name}` : ""}`,
          sourceUrl: release.html_url,
          sourceName: sourceName,
          summary: release.body?.slice(0, 500) + (release.body?.length > 500 ? "..." : "") || "No release notes provided.",
          rawArticleId: null,
          sourceType: 'GITHUB'
        });
      }
    }

    console.log(`   📊 [githubScanner] Found ${findings.length} new matching releases.`);
    return findings;

  } catch (err) {
    console.error(`❌ [githubScanner] Failed to fetch ${sourceName}:`, err.message);
    return [];
  }
}
