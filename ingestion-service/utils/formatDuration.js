/**
 * Formats a duration in milliseconds to a human-readable string.
 * Prints in seconds if < 60s, or in minutes and seconds if >= 60s.
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g. "45.2s" or "3m 5.1s")
 */
export default function formatDuration(ms) {
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remainingSecs = (seconds % 60).toFixed(1);
  return `${mins}m ${remainingSecs}s`;
}
