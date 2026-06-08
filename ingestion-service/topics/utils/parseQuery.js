/**
 * Parse an AI-refined query string OR conceptualKeywords JSON into structured search conditions.
 *
 * If topic.conceptualKeywords exists, it uses that directly.
 * Otherwise, it parses topic.aiRefinedQuery string.
 *
 * Returns an array of term-groups. A match occurs if ANY group fully matches
 * (i.e. groups are OR'd, terms within a group are AND'd).
 */
export function parseQuery(topic) {
  // 1. Prefer structured conceptualKeywords if available
  if (
    topic.conceptualKeywords &&
    Array.isArray(topic.conceptualKeywords) &&
    topic.conceptualKeywords.length > 0
  ) {
    return topic.conceptualKeywords;
  }

  const query = topic.aiRefinedQuery;
  if (!query || typeof query !== "string") return [];

  // 2. Fallback to parsing the aiRefinedQuery string
  // Split by OR (case-insensitive, surrounded by spaces)
  const orSegments = query
    .split(/\s+OR\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const groups = [];

  for (const segment of orSegments) {
    const terms = [];

    // Extract quoted phrases first
    const quotedRegex = /"([^"]+)"/g;
    let match;
    let remainder = segment;

    while ((match = quotedRegex.exec(segment)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length > 0) {
        terms.push(phrase);
      }
      remainder = remainder.replace(match[0], " ");
    }

    // Remaining bare words — filter short ones (≤2 chars)
    const bareWords = remainder
      .split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 2);

    terms.push(...bareWords);

    if (terms.length > 0) {
      groups.push(terms);
    }
  }

  return groups;
}
