/**
 * Safely extracts the hostname from a URL string.
 * Falls back to returning "Web" or the provided fallback if parsing fails.
 *
 * @param {string} url - The URL to parse
 * @param {string} fallback - The string to return if parsing fails
 * @returns {string} The hostname or fallback
 */
export default function extractHostname(url, fallback = "Web") {
  try {
    return new URL(url).hostname;
  } catch {
    return fallback;
  }
}
