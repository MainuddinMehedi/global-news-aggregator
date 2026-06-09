/**
 * Resolve a redirect URL to the final destination via a HEAD request.
 * Useful for URLs from feeds that wrap article links behind redirects
 * (e.g. Google News RSS).
 *
 * @param {string} url - The redirect URL to resolve
 * @returns {Promise<string>} The resolved URL (or original on failure)
 */
export async function resolveRedirectUrl(url) {
  if (!url) return url;

  try {
    const resp = await fetch(url, { method: "HEAD", redirect: "manual" });
    const location = resp.headers.get("location");
    if (location) return location;
  } catch {
    // resolve failed — return original
  }
  return url;
}
