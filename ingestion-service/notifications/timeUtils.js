/**
 * Parses a frequency string like "12h", "24h", "weekly" into milliseconds.
 * Defaults to 12 hours (43200000 ms) if parsing fails.
 * @param {string} frequency
 * @returns {number} duration in milliseconds
 */
export function parseFrequencyToMs(frequency) {
  if (!frequency) return 12 * 60 * 60 * 1000;

  const freq = frequency.toLowerCase().trim();

  if (freq === "weekly") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  if (freq.endsWith("h")) {
    const hours = parseInt(freq.replace("h", ""), 10);
    if (!isNaN(hours)) {
      return hours * 60 * 60 * 1000;
    }
  }

  if (freq.endsWith("d")) {
    const days = parseInt(freq.replace("d", ""), 10);
    if (!isNaN(days)) {
      return days * 24 * 60 * 60 * 1000;
    }
  }

  // Fallback to 12h
  return 12 * 60 * 60 * 1000;
}

/**
 * Determines if a digest is due and returns the exact cutoff date to query for new items.
 * @param {string} frequency - e.g., "12h"
 * @param {Date | null} lastDigestAt - The timestamp of the last digest sent
 * @returns {{ isDue: boolean, cutoffDate: Date }}
 */
export function calculateDigestWindow(frequency, lastDigestAt) {
  const durationMs = parseFrequencyToMs(frequency);
  const now = Date.now();

  // If we've never sent a digest, or it was null, fallback to the duration itself
  if (!lastDigestAt) {
    return {
      isDue: true,
      cutoffDate: new Date(now - durationMs),
    };
  }

  const lastTimeMs = lastDigestAt.getTime();
  const timeSinceLastDigest = now - lastTimeMs;

  // We add a 5-minute (300000ms) tolerance window since cron jobs can be slightly delayed or early
  const isDue = timeSinceLastDigest >= durationMs - 300000;

  return {
    isDue,
    cutoffDate: lastDigestAt, // Fetch everything since the exact moment the last digest was sent
  };
}
