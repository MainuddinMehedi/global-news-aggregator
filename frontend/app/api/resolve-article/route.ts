import { NextResponse } from "next/server";
import { extract } from "@extractus/article-extractor";
import { marked } from "marked";
import { searchArticleUrl } from "@/lib/search-article";

const SOCIAL_SITES = [
  "youtube.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "reddit.com",
  "instagram.com",
  "tiktok.com",
];

interface CacheEntry {
  content: string;
  url: string;
  ts: number;
}

const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000;

function buildQuery(title: string): string {
  const negativeFilters = SOCIAL_SITES.map((s) => `-site:${s}`).join(" ");
  const source = title.split(" - ").pop() || "";
  const keywordBoost = source ? ` ${source}` : "";
  return `${title}${keywordBoost} ${negativeFilters}`;
}

export async function POST(request: Request) {
  const { title } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const cacheKey = title;
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ content: cached.content, url: cached.url });
  }

  const query = buildQuery(title);

  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          scrapeOptions: { formats: ["markdown"] },
        }),
      });

      if (fcRes.ok) {
        const fcData = await fcRes.json();
        const result = fcData.data?.[0];
        if (result?.markdown) {
          const html = await marked.parse(result.markdown);
          const entry: CacheEntry = { content: html, url: result.url || "", ts: Date.now() };
          resultCache.set(cacheKey, entry);
          return NextResponse.json({ content: html, url: result.url || "" });
        }
      }
    } catch (e) {
      console.warn("[resolve-article] Firecrawl failed:", e);
    }
  }

  try {
    const foundUrl = await searchArticleUrl(query);
    if (foundUrl) {
      const article = await extract(foundUrl);
      if (article?.content) {
        const entry: CacheEntry = { content: article.content, url: foundUrl, ts: Date.now() };
        resultCache.set(cacheKey, entry);
        return NextResponse.json({ content: article.content, url: foundUrl });
      }
    }
  } catch (e) {
    console.warn("[resolve-article] Fallback search failed:", e);
  }

  return NextResponse.json(
    { error: "Could not fetch article. Open the original link to read." },
    { status: 404 },
  );
}
