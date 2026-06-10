export const CANONICAL_CATEGORIES = [
  "geopolitics",
  "economy",
  "business",
  "technology",
  "environment",
  "health",
  "security",
  "politics",
  "society",
  "bangladesh",
  "other",
];

export const EXTRA_CATEGORIES = [
  "science",
  "sports",
  "entertainment",
  "lifestyle",
  "gaming",
  "crypto",
];

export const ALL_CATEGORIES = [...CANONICAL_CATEGORIES, ...EXTRA_CATEGORIES];

export const DEFAULT_CUSTOM_SOURCES = [
  { id: "1", name: "The Daily Star", url: "https://www.thedailystar.net/frontpage/rss.xml", country: "Bangladesh", priority: "medium", enabled: true },
  { id: "2", name: "Dhaka Tribune", url: "https://www.dhakatribune.com/feed/", country: "Bangladesh", priority: "medium", enabled: true },
  { id: "3", name: "BD24 Live", url: "https://www.bd24live.com/feed", country: "Bangladesh", priority: "medium", enabled: true },
  { id: "4", name: "Jagonews24", url: "https://www.jagonews24.com/rss/rss.xml", country: "Bangladesh", priority: "medium", enabled: false },
  { id: "5", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", country: "Qatar", priority: "medium", enabled: true },
  { id: "6", name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml", country: "Global", priority: "medium", enabled: true },
  { id: "7", name: "TechCrunch", url: "https://techcrunch.com/feed/", country: "USA", priority: "medium", enabled: true },
];
