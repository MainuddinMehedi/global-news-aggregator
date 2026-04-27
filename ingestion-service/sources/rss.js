import Parser from "rss-parser";

const parser = new Parser();

function extractText(value) {
  if (!value) return "";

  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(extractText).find(Boolean) || "";

  if (typeof value === "object") {
    if (typeof value._ === "string") return value._.trim();

    for (const nestedValue of Object.values(value)) {
      const text = extractText(nestedValue);
      if (text) return text;
    }
  }

  return "";
}

export default async function* fetchRSSStream(
  sourceName,
  sourceCountry,
  feedUrl,
) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        Accept:
          "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "global-news-aggregator/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    console.log(
      `Fetched ${feed.items.length} items from ${sourceName} (${sourceCountry})`,
    );

    for (const item of feed.items) {
      yield {
        title: extractText(item.title),
        url: item.link,
        contentSnippet:
          item.contentSnippet || item.content?.slice(0, 500) || "",
        source: sourceName,
        sourceCountry: sourceCountry,
        category: item.categories ? item.categories.join(", ") : "",
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      };
    }
  } catch (err) {
    console.log(`[RSS Stream Error] ${sourceName}`, err);
  }
}
