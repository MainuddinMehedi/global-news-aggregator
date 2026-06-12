const urlCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export async function searchArticleUrl(query: string): Promise<string | null> {
  if (!process.env.SERPLY_API_KEY) return null;

  const cached = urlCache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.url;

  try {
    const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}&num=5`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": process.env.SERPLY_API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const found = data.results?.[0]?.link || null;
    if (found) urlCache.set(query, { url: found, ts: Date.now() });
    return found;
  } catch {
    return null;
  }
}
