import { evaluateQuery } from "../utils/parseQuery.js";

const USER_AGENT = 'global-news-aggregator/1.0 (LockedTopics GitHub Monitor)';

function parseGithubUrl(url) {
  try {
    const cleanUrl = url.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    const repo = parts.pop();
    const owner = parts.pop();
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch (err) {
    return null;
  }
}

function getHeaders() {
  const headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/vnd.github.v3+json'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}


export async function scanGithub(topic, sourceConfig, options = {}) {
  const { url, label } = sourceConfig;

  if (url) {
    return scanSpecificRepo(topic, url, label, options);
  } else {
    return searchGithub(topic, label, options);
  }
}

async function scanSpecificRepo(topic, url, label, options) {
  const repoInfo = parseGithubUrl(url);
  if (!repoInfo) {
    console.warn(`⚠️ [githubScanner] Invalid GitHub URL: ${url}`);
    return { findings: [], metadata: {} };
  }

  const { owner, repo } = repoInfo;
  const sourceName = label || `${owner}/${repo}`;
  console.log(`🔍 [githubScanner] Tracking ${sourceName}...`);

  const headers = getHeaders();
  const findings = [];
  const lastScan = topic.lastScannedAt ? new Date(topic.lastScannedAt) : new Date(0);

  // 1. Releases
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (response.ok) {
      const releases = await response.json();
      for (const release of releases) {
        const pubDate = new Date(release.published_at || release.created_at);
        if (pubDate <= lastScan) continue;

        const content = `${release.name || ""} ${release.tag_name || ""} ${release.body || ""}`;
        if (!evaluateQuery(topic, content)) continue;

        findings.push({
          title: `[Release] ${release.tag_name}${release.name ? `: ${release.name}` : ""}`,
          sourceUrl: release.html_url,
          sourceName,
          summary: release.body?.slice(0, 500) + (release.body?.length > 500 ? "..." : "") || "No release notes provided.",
          rawArticleId: null,
          sourceType: 'GITHUB'
        });
      }
    } else {
      if (response.status === 404) console.warn(`   ⚠️ [githubScanner] Repo not found: ${sourceName}`);
      else if (response.status === 403) {
        console.warn(`   ⚠️ [githubScanner] Rate limited`);
        // TODO(notification): Admin - GitHub API 403 rate limit (no token or exhausted) → feeds into Source Health dashboard / admin alert
      }
      else console.warn(`   ⚠️ [githubScanner] Releases fetch failed: ${response.status}`);
    }
  } catch (err) {
    console.error(`   ❌ [githubScanner] Failed to fetch releases for ${sourceName}:`, err.message);
  }

  // 2. Merged PRs
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=10`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (response.ok) {
      const prs = await response.json();
      for (const pr of prs) {
        if (!pr.merged_at) continue;
        const mergedDate = new Date(pr.merged_at);
        if (mergedDate <= lastScan) continue;

        const content = `${pr.title || ""} ${pr.body || ""}`;
        if (!evaluateQuery(topic, content)) continue;

        findings.push({
          title: `[PR] #${pr.number}: ${pr.title}`,
          sourceUrl: pr.html_url,
          sourceName,
          summary: pr.body?.slice(0, 500) + (pr.body?.length > 500 ? "..." : "") || "No description provided.",
          rawArticleId: null,
          sourceType: 'GITHUB'
        });
      }
    } else {
      console.warn(`   ⚠️ [githubScanner] PRs fetch failed: ${response.status}`);
    }
  } catch (err) {
    console.error(`   ❌ [githubScanner] Failed to fetch PRs for ${sourceName}:`, err.message);
  }

  console.log(`   📊 [githubScanner] Found ${findings.length} new items from ${sourceName}.`);
  return { findings, metadata: {} };
}

async function searchGithub(topic, label, options) {
  const query = topic.aiRefinedQuery || topic.displayName;
  if (!query) return { findings: [], metadata: {} };

  const sourceName = label || "GitHub Search";
  console.log(`🔍 [githubScanner] Searching GitHub for "${query}"...`);

  const headers = getHeaders();
  const findings = [];

  // 1. Search repositories
  try {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=updated&per_page=5`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (response.ok) {
      const data = await response.json();
      for (const repo of data.items || []) {
        const content = `${repo.full_name} ${repo.description || ""} ${repo.topics?.join(" ") || ""}`;
        if (!evaluateQuery(topic, content)) continue;

        const stars = repo.stargazers_count ? `⭐ ${repo.stargazers_count}` : "";
        const lang = repo.language ? `[${repo.language}]` : "";
        const desc = repo.description?.slice(0, 120) || "";
        findings.push({
          title: `[Repo] ${repo.full_name}` + (desc ? ` — ${desc}` : ""),
          sourceUrl: repo.html_url,
          sourceName,
          summary: `${lang} ${stars} ${repo.description || ""}`.trim().slice(0, 500) || "No description.",
          rawArticleId: null,
          sourceType: 'GITHUB'
        });
      }
      console.log(`   📊 [githubScanner] Found ${data.items?.length || 0} matching repos.`);
    } else {
      if (response.status === 403) console.warn(`   ⚠️ [githubScanner] Search rate limited`);
      else console.warn(`   ⚠️ [githubScanner] Repo search failed: ${response.status}`);
    }
  } catch (err) {
    console.error(`   ❌ [githubScanner] Failed to search repos:`, err.message);
  }

  // 2. Search merged PRs
  try {
    const encodedQuery = encodeURIComponent(`${query} is:pr is:merged`);
    const apiUrl = `https://api.github.com/search/issues?q=${encodedQuery}&sort=updated&per_page=10`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });

    if (response.ok) {
      const data = await response.json();
      for (const item of data.items || []) {
        const content = `${item.title || ""} ${item.body || ""}`;
        if (!evaluateQuery(topic, content)) continue;

        const repoFullName = item.repository_url?.split("/").slice(-2).join("/") || "";
        findings.push({
          title: `[PR] #${item.number}: ${item.title} (${repoFullName})`,
          sourceUrl: item.html_url,
          sourceName,
          summary: item.body?.slice(0, 500) + (item.body?.length > 500 ? "..." : "") || "No description.",
          rawArticleId: null,
          sourceType: 'GITHUB'
        });
      }
      console.log(`   📊 [githubScanner] Found ${data.items?.length || 0} matching merged PRs.`);
    } else {
      console.warn(`   ⚠️ [githubScanner] Issues search failed: ${response.status}`);
    }
  } catch (err) {
    console.error(`   ❌ [githubScanner] Failed to search merged PRs:`, err.message);
  }

  console.log(`   📊 [githubScanner] Total search findings: ${findings.length}`);
  return { findings, metadata: {} };
}
