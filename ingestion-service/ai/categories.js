/**
 * The definitive list of allowed categories in the system.
 * This is the SINGLE SOURCE OF TRUTH.
 * 
 * If you drop a category from here, the ingestion pipeline will route
 * those articles to "other" (acting as a Dead Letter Queue) unless mapped
 * to a remaining core category via the Stage 1 Gazetteer JSON.
 * 
 * Core 10 Categories:
 *   geopolitics — International relations, treaties, cross-border issues, intl law
 *   economy     — Macroeconomics, inflation, GDP, central banks
 *   business    — Microeconomics, IPOs, M&A, corporate fraud
 *   technology  — AI, cyber, semiconductors, applied science, aerospace
 *   environment — Climate policy, energy transition, natural disasters
 *   security    — Military, defense, terrorism, pandemics, bio-security
 *   politics    — Domestic governance, elections, supreme court, local law
 *   society     — Human rights, protests, humanitarian crises, cultural soft-power
 *   bangladesh  — Bangladesh-specific news
 *   sports      — Olympics, World Cup, FIFA (strictly filtered, no daily noise)
 *   other       — Catch-all fallback / Dead Letter Queue
 */
export const ALLOWED_CATEGORIES = [
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
  "other"
];
