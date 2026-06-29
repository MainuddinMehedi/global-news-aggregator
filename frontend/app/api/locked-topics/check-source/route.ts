import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { detectSourceType } from "@/lib/sourceDetection";

const USER_AGENT = "global-news-aggregator/1.0 (Source Validator)";

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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ valid: false, error: "Invalid URL format. Make sure to include http:// or https://" });
    }

    const type = detectSourceType(url);

    try {
      if (type === "github") {
        const repoInfo = parseGithubUrl(url);
        if (!repoInfo) {
          return NextResponse.json({ valid: false, type, error: "Could not parse GitHub owner/repo from URL." });
        }
        const { owner, repo } = repoInfo;
        const headers: Record<string, string> = {
          "User-Agent": USER_AGENT,
          "Accept": "application/vnd.github.v3+json",
        };
        if (process.env.GITHUB_TOKEN) {
          headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }
        const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (apiRes.status === 404) {
          return NextResponse.json({ valid: false, type, error: "GitHub repository not found." });
        }
        if (apiRes.status === 403) {
          return NextResponse.json({ valid: false, type, error: "Access forbidden or GitHub API rate limit reached." });
        }
        if (!apiRes.ok) {
          return NextResponse.json({ valid: false, type, error: `GitHub API returned status ${apiRes.status}.` });
        }
      } else if (type === "reddit") {
        let subreddit = "";
        if (url.includes("/r/")) {
          subreddit = url.split("/r/")[1].split("/")[0].trim();
        }
        if (!subreddit) {
          return NextResponse.json({ valid: false, type, error: "Could not parse subreddit name from URL." });
        }

        const apiRes = await fetch(`https://www.reddit.com/r/${subreddit}/about.json`, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (apiRes.status === 404 || apiRes.status === 403) {
          return NextResponse.json({ valid: false, type, error: `Subreddit r/${subreddit} not found, private, or banned.` });
        }
        if (!apiRes.ok) {
          return NextResponse.json({ valid: false, type, error: `Reddit returned status ${apiRes.status}.` });
        }
      } else if (type === "company_careers") {
        const lowerUrl = url.toLowerCase();
        let slug = "";
        let isGreenhouse = false;
        let isLever = false;

        if (lowerUrl.includes("greenhouse.io")) {
          isGreenhouse = true;
          slug = url.split("/boards/")[1]?.split("/")[0]?.replace(/[^a-z0-9]/g, "").trim();
        } else if (lowerUrl.includes("lever.co")) {
          isLever = true;
          slug = url.split("/jobs/")[1]?.split("/")[0]?.replace(/[^a-z0-9]/g, "").trim();
        }

        if (!slug) {
          return NextResponse.json({ valid: false, type, error: "Could not parse company name from ATS URL." });
        }

        if (isGreenhouse) {
          const apiRes = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(8000),
          });
          if (!apiRes.ok) {
            return NextResponse.json({ valid: false, type, error: `Greenhouse job board for "${slug}" does not exist.` });
          }
        } else if (isLever) {
          const apiRes = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
            headers: { "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(8000),
          });
          if (!apiRes.ok) {
            return NextResponse.json({ valid: false, type, error: `Lever job board for "${slug}" does not exist.` });
          }
        }
      } else if (type === "rss") {
        const apiRes = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!apiRes.ok) {
          return NextResponse.json({ valid: false, type, error: `RSS URL returned status ${apiRes.status}.` });
        }
        const text = await apiRes.text();
        const cleanText = text.trim();
        const isXml = cleanText.startsWith("<") && (
          cleanText.includes("<rss") ||
          cleanText.includes("<feed") ||
          cleanText.includes("<channel") ||
          cleanText.includes("<xml")
        );
        if (!isXml) {
          return NextResponse.json({ valid: false, type, error: "URL is reachable but does not return valid RSS/Atom XML." });
        }
      } else {
        // webpage / search / general
        const apiRes = await fetch(url, {
          method: "GET",
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!apiRes.ok) {
          return NextResponse.json({ valid: false, type, error: `URL returned status ${apiRes.status}.` });
        }
      }

      return NextResponse.json({ valid: true, type });
    } catch (fetchErr: any) {
      console.warn("Validation fetch error:", fetchErr.message);
      return NextResponse.json({ valid: false, type, error: `Connection failed: ${fetchErr.message}.` });
    }
  } catch (err: any) {
    console.error("Check source route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
