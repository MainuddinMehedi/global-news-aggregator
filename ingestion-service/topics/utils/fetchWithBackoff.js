/**
 * Fetches a URL with exponential backoff and rate limit (HTTP 429) handling.
 * 
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} retries - Max number of retries.
 * @param {number} delay - Base delay in ms for exponential backoff.
 * @returns {Promise<Response>} The fetch Response.
 */
export async function fetchWithBackoff(url, options = {}, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay * Math.pow(2, i);
        console.warn(`⚠️ [fetchWithBackoff] Hit HTTP 429 Rate Limit. Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      const waitTime = delay * Math.pow(2, i);
      console.warn(`⚠️ [fetchWithBackoff] Fetch error: ${err.message}. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Max retries exceeded");
}
