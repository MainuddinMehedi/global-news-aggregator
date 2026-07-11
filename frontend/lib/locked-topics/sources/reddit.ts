import { USER_AGENT, ValidationResult } from "./shared";

// --- SERVER-SIDE VALIDATION ---

export async function validateRedditSource(
  url: string,
  type: string,
): Promise<ValidationResult> {
  let subreddit = "";

  if (url.includes("/r/")) {
    subreddit = url.split("/r/")[1].split("/")[0].trim();
  }
  if (!subreddit) {
    return {
      valid: false,
      type,
      error: "Could not parse subreddit name from URL.",
    };
  }

  const apiRes = await fetch(
    `https://www.reddit.com/r/${subreddit}/about.json`,
    {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (apiRes.status === 404 || apiRes.status === 403) {
    return {
      valid: false,
      type,
      error: `Subreddit r/${subreddit} not found, private, or banned.`,
    };
  }
  if (!apiRes.ok) {
    return {
      valid: false,
      type,
      error: `Reddit returned status ${apiRes.status}.`,
    };
  }
  return { valid: true, type };
}
