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

/**
 * Fetches and streams articles from an RSS/Atom feed.
 *
 * For detailed compatibility documentation, see docs/METADATA_DEVELOPMENT_LOG.md.
 *
 * Previous positional parameter patterns:
 * - 3 arguments (topic scanners): fetchRSSStream(sourceName, sourceCountry, feedUrl)
 * - 5 arguments (legacy ingestion): fetchRSSStream(sourceName, sourceCountry, sourceOrigin, sourceType, feedUrl)
 *
 * Current 7-argument signature:
 */
export default async function* fetchRSSStream(
  sourceName,
  sourceCountry,
  sourceOrigin,
  sourceType,
  feedUrl,
  biasGroup,
  coverageScope,
) {
  let url = feedUrl;
  let country = sourceCountry;
  let origin = sourceOrigin;
  let type = sourceType;
  let bias = biasGroup;
  let scope = coverageScope;

  if (arguments.length === 3) {
    url = arguments[2];
    origin = null;
    type = null;
    bias = null;
    scope = null;
  } else if (arguments.length === 5) {
    url = arguments[4];
    bias = null;
    scope = null;
  }

  try {
    const response = await fetch(url, {
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

    const countryText = country ? ` (${country})` : "";
    console.log(
      `Fetched ${feed.items.length} items from ${sourceName}${countryText}`,
    );

    for (const item of feed.items) {
      yield {
        title: extractText(item.title),
        url: item.link,
        contentSnippet: item.contentSnippet || item.content || "",
        source: sourceName,
        sourceCountry: country,
        sourceOrigin: origin,
        sourceType: type,
        biasGroup: bias,
        coverageScope: scope,
        category: item.categories ? item.categories.join(", ") : "",
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      };
    }
  } catch (err) {
    console.log(`[RSS Stream Error] ${sourceName}`, err);
  }
}
