/**
 * RSS feed sources for the ingestion pipeline.
 *
 * Each entry must have:
 *   - name:          Human-readable source name
 *   - sourceCountry: Country of origin (or "Global")
 *   - url:           RSS/Atom feed URL
 *   - enabled:       Set to false to skip without deleting the entry
 */

const feeds = [
  // ── Bangladesh ───────────────────────────────────────────
  {
    name: "The Daily Star",
    sourceCountry: "Bangladesh",
    url: "https://www.thedailystar.net/frontpage/rss.xml",
    enabled: true,
  },
  {
    name: "Dhaka Tribune",
    sourceCountry: "Bangladesh",
    url: "https://www.dhakatribune.com/feed/",
    enabled: true,
  },
  {
    name: "BD24 Live",
    sourceCountry: "Bangladesh",
    url: "https://www.bd24live.com/feed",
    enabled: true,
  },
  {
    name: "Jagonews24",
    sourceCountry: "Bangladesh",
    url: "https://www.jagonews24.com/rss/rss.xml",
    enabled: true,
  },

  // ── International ────────────────────────────────────────
  {
    name: "Al Jazeera",
    sourceCountry: "Qatar",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    enabled: true,
  },
  {
    name: "UN News",
    sourceCountry: "Global",
    url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml",
    enabled: true,
  },
  {
    name: "TechCrunch",
    sourceCountry: "USA",
    url: "https://techcrunch.com/feed/",
    enabled: true,
  },
];

/** Returns only feeds where `enabled` is true. */
export function getActiveFeeds() {
  return feeds.filter((f) => f.enabled);
}

/** Returns all feeds regardless of enabled status. */
export function getAllFeeds() {
  return feeds;
}

export default feeds;
