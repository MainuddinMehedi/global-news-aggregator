import { detectSourceType } from "../sourceDetection";
import { USER_AGENT, ValidationResult } from "./shared";

// --- CLIENT-SIDE VALIDATION ---

export function getGithubUrlError(url: string): string | null {
  if (!url) return null;

  try {
    new URL(url);
  } catch {
    return "Enter a valid URL.";
  }

  if (detectSourceType(url) === "rss")
    return "This looks like a feed URL. Paste it in the custom sources input below.";
  if (detectSourceType(url) !== "github")
    return "Enter a GitHub repo URL like https://github.com/owner/repo";

  const path = new URL(url).pathname
    .replace(/\/$/, "")
    .split("/")
    .filter(Boolean);

  if (path.length < 2)
    return "Enter a full repo URL like https://github.com/owner/repo";
  if (path.length > 2) return "Enter a repo URL without extra path segments.";

  return null;
}

// --- SHARED PARSING ---

function parseGithubUrl(url: string) {
  try {
    const cleanUrl = url.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    const repo = parts.pop();
    const owner = parts.pop();

    if (!owner || !repo) return null;

    return { owner, repo };
  } catch {
    return null;
  }
}

// --- SERVER-SIDE VALIDATION ---

export async function validateGithubSource(
  url: string,
  type: string,
): Promise<ValidationResult> {
  const repoInfo = parseGithubUrl(url);
  if (!repoInfo) {
    return {
      valid: false,
      type,
      error: "Could not parse GitHub owner/repo from URL.",
    };
  }
  const { owner, repo } = repoInfo;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
  }
  const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (apiRes.status === 404) {
    return { valid: false, type, error: "GitHub repository not found." };
  }
  if (apiRes.status === 403) {
    return {
      valid: false,
      type,
      error: "Access forbidden or GitHub API rate limit reached.",
    };
  }
  if (!apiRes.ok) {
    return {
      valid: false,
      type,
      error: `GitHub API returned status ${apiRes.status}.`,
    };
  }
  return { valid: true, type };
}
