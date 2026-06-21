export const CANONICAL_CATEGORIES = [
  "geopolitics",
  "economy",
  "business",
  "technology",
  "environment",
  "security",
  "politics",
  "society",
  "bangladesh",
  "sports",
  "other",
];

export const EXTRA_CATEGORIES = [
  "science",
  "entertainment",
  "lifestyle",
  "gaming",
  "crypto",
];

export const ALL_CATEGORIES = [...CANONICAL_CATEGORIES, ...EXTRA_CATEGORIES];

export const CANONICAL_REGIONS = [
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "South America",
  "Africa",
  "Global",
];

export const CANONICAL_BIAS_GROUPS = [
  "Left-leaning",
  "Right-leaning",
  "Centrist",
  "State-Aligned",
  "State-Controlled",
  "Other",
];

export const CANONICAL_COVERAGE_SCOPES = [
  "Global",
  "Regional",
  "National",
  "Local",
];

export const CANONICAL_SOURCE_TYPES = [
  "Commercial Publisher",
  "State Media",
  "Independent Wire",
  "Think Tank",
  "Other",
];

export const BUILTIN_SOURCES = [
  { id: "1", name: "The Daily Star", url: "https://www.thedailystar.net/frontpage/rss.xml", country: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", biasGroup: "Centrist", coverageScope: "National", enabled: true },
  { id: "2", name: "Dhaka Tribune", url: "https://www.dhakatribune.com/feed/", country: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", biasGroup: "Centrist", coverageScope: "National", enabled: true },
  { id: "3", name: "BD24 Live", url: "https://www.bd24live.com/feed", country: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", biasGroup: "Centrist", coverageScope: "National", enabled: true },
  { id: "4", name: "Jagonews24", url: "https://www.jagonews24.com/rss/rss.xml", country: "Bangladesh", sourceOrigin: "Asia-Pacific", sourceType: "Commercial Publisher", biasGroup: "Centrist", coverageScope: "National", enabled: false },
  { id: "5", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", country: "Qatar", sourceOrigin: "Middle East", sourceType: "State Media", biasGroup: "State-Aligned", coverageScope: "Global", enabled: true },
  { id: "6", name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/region/global/feed/rss.xml", country: "Global", sourceOrigin: "Global", sourceType: "Independent Wire", biasGroup: "Centrist", coverageScope: "Global", enabled: true },
  { id: "7", name: "TechCrunch", url: "https://techcrunch.com/feed/", country: "USA", sourceOrigin: "North America", sourceType: "Commercial Publisher", biasGroup: "Centrist", coverageScope: "Global", enabled: true },
];

