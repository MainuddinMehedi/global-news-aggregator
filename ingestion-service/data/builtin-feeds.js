/**
 * Built-in default feed sources (seed source for the DB FeedSource table).
 *
 * Each entry must have:
 *   - name:          Human-readable source name
 *   - sourceCountry: Country of origin (or "Global" / empty for intl wires)
 *   - sourceType:    e.g. "Commercial Publisher", "State Media", "Independent Wire"
 *   - biasGroup:     e.g. "Centrist", "State-Aligned", "Left-Leaning", "Right-Leaning"
 *   - coverageScope: "National" or "Global"
 *   - url:           RSS/Atom feed URL
 *   - enabled:       Set to false to skip without deleting the entry
 */

const builtinFeeds = [
  // ── Bangladesh ───────────────────────────────────────────
  {
    name: "The Daily Star",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.thedailystar.net/frontpage/rss.xml",
    enabled: true,
  },
  {
    name: "Dhaka Tribune",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.dhakatribune.com/feed/",
    enabled: true,
  },
  {
    name: "BD24 Live",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.bd24live.com/feed",
    enabled: true,
  },
  {
    name: "Jagonews24",
    sourceCountry: "Bangladesh",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "National",
    url: "https://www.jagonews24.com/rss/rss.xml",
    enabled: false,
  },

  // ── International ────────────────────────────────────────
  {
    name: "Al Jazeera",
    sourceCountry: "Qatar",
    sourceType: "State Media",
    biasGroup: "State-Aligned",
    coverageScope: "Global",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    enabled: true,
  },
  {
    name: "UN News",
    sourceCountry: "",
    sourceType: "Independent Wire",
    biasGroup: "Centrist",
    coverageScope: "Global",
    url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml",
    enabled: true,
  },
  {
    name: "TechCrunch",
    sourceCountry: "USA",
    sourceType: "Commercial Publisher",
    biasGroup: "Centrist",
    coverageScope: "Global",
    url: "https://techcrunch.com/feed/",
    enabled: true,
  },
];

export default builtinFeeds;
