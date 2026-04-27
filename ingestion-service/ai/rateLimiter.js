/**
 * Sliding-window rate limiter for AI API calls.
 * 
 * Tracks tokens and requests within a rolling 60-second window.
 * Before each batch, checks if sending it would exceed the TPM/RPM budget.
 * If so, waits until enough capacity frees up, then proceeds.
 */

const TPM_LIMIT = parseInt(process.env.AI_TPM_LIMIT) || 25000;
const RPM_LIMIT = parseInt(process.env.AI_RPM_LIMIT) || 28;

// Rolling window entries: { timestamp: number, tokens: number }
const window = [];

function pruneWindow() {
  const cutoff = Date.now() - 60_000;
  while (window.length > 0 && window[0].timestamp < cutoff) {
    window.shift();
  }
}

function getWindowUsage() {
  pruneWindow();
  const tokens = window.reduce((sum, entry) => sum + entry.tokens, 0);
  const requests = window.length;
  return { tokens, requests };
}

/**
 * Wait until there's enough capacity in the current minute window
 * to send a batch with the given estimated token count.
 */
export async function waitForCapacity(estimatedTokens) {
  while (true) {
    pruneWindow();
    const { tokens, requests } = getWindowUsage();

    const tokensFit = tokens + estimatedTokens <= TPM_LIMIT;
    const requestsFit = requests + 1 <= RPM_LIMIT;

    if (tokensFit && requestsFit) {
      return; // Good to go
    }

    // Calculate how long to wait until oldest entry exits the window
    if (window.length === 0) {
      return; // Window is empty, shouldn't happen but safe to proceed
    }

    const oldestTimestamp = window[0].timestamp;
    const waitMs = (oldestTimestamp + 60_000) - Date.now() + 100; // +100ms buffer

    if (waitMs <= 0) {
      continue; // Entry should have expired, re-check
    }

    const waitSec = Math.ceil(waitMs / 1000);
    const reason = !tokensFit
      ? `TPM (${tokens.toLocaleString()}/${TPM_LIMIT.toLocaleString()} used)`
      : `RPM (${requests}/${RPM_LIMIT} used)`;

    console.log(`⏳ Rate limit: waiting ${waitSec}s for ${reason} to reset...`);

    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}

/**
 * Record actual token usage after an API call completes.
 * Uses the real token count from the API response, not estimates.
 */
export function recordUsage(actualTokens) {
  window.push({
    timestamp: Date.now(),
    tokens: actualTokens,
  });
}

/**
 * Log rate limit info from Groq response headers (informational only).
 */
export function logHeaders(headers) {
  const remaining = headers.get('x-ratelimit-remaining-tokens');
  const reset = headers.get('x-ratelimit-reset-tokens');
  if (remaining !== null) {
    console.log(`   📊 Groq TPM remaining: ${remaining}, resets in: ${reset || '?'}`);
  }
}
