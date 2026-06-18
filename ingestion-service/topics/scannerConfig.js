/**
 * Scanner Configuration — Centralized constants for all topic scanners.
 *
 * Every scanner imports its limits from here instead of declaring local constants.
 * This makes tuning, debugging, and auditing the system straightforward.
 */

export const SCANNER_CONFIG = {
  /** Minimum AI relevance score to keep a finding (0.0–1.0). */
  minRelevance: 0.5,

  /** Number of findings per batch sent to the AI scorer. */
  scorerBatchSize: 20,

  /**
   * Per-source maximum results.
   *
   * These are intentionally different: RSS feeds are high-volume and cheap
   * to scan, while API-backed sources have rate limits or cost constraints.
   */
  maxResults: {
    internalDb: 200,
    rss: 100,
    googleNews: 100,
    brave: 20,
    reddit: 25,
    github: 10,
    youtube: 20,
    search: 20,
    bdGovJobs: 30,
    companyCareers: 30,
    webpage: 1, // Webpage diff produces at most 1 finding per URL
  },
};

/**
 * Valid source type values for the scanner dispatch switch.
 * Used for pre-validation before dispatching to prevent typos
 * from silently falling to the default case.
 */
export const VALID_SOURCE_TYPES = new Set([
  "google_news",
  "rss",
  "brave",
  "reddit",
  "github",
  "youtube",
  "bd_gov_jobs",
  "company_careers",
  "search",
  "internal_db",
  "scrape",
  "webpage",
]);
