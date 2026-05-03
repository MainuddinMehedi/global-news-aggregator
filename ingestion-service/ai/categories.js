/**
 * Canonical list of allowed article categories.
 * The AI is instructed to use only these values. Any category returned
 * outside this list is dropped server-side, and the article falls back to "other".
 *
 * Category guide (to keep them distinct):
 *   geopolitics — wars, diplomacy, international relations
 *   economy     — macro: inflation, trade policy, GDP, sanctions, central banks
 *   business    — micro: company earnings, M&A, startups, IPOs, corporate strategy, layoffs
 *   technology  — AI, cyber, space, big tech
 *   environment — climate, disasters, energy transition
 *   health      — pandemics, public health policy
 *   security    — terrorism, crime, military operations
 *   politics    — elections, governance, domestic policy
 *   society     — culture, human rights, education, social issues
 *   bangladesh  — Bangladesh-specific news (any topic)
 *   other       — catch-all fallback
 */
export const ALLOWED_CATEGORIES = [
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
