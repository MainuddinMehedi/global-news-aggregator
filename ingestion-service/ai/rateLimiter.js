/**
 * Sliding-window rate limiter for AI API calls.
 * 
 * Tracks tokens and requests within a rolling 60-second window.
 * Before each batch, checks if sending it would exceed the TPM/RPM budget.
 * If so, waits until enough capacity frees up, then proceeds.
 */

const TPM_LIMIT = parseInt(process.env.AI_TPM_LIMIT) || 25000;
const RPM_LIMIT = parseInt(process.env.AI_RPM_LIMIT) || 28;

// Rolling window entries per provider: { [provider]: [{ timestamp: number, tokens: number }] }
const windows = {};

function pruneWindow(provider) {
  if (!windows[provider]) windows[provider] = [];
  const window = windows[provider];
  const cutoff = Date.now() - 60_000;
  while (window.length > 0 && window[0].timestamp < cutoff) {
    window.shift();
  }
}

function getWindowUsage(provider) {
  pruneWindow(provider);
  const window = windows[provider];
  const tokens = window.reduce((sum, entry) => sum + entry.tokens, 0);
  const requests = window.length;
  return { tokens, requests, window };
}

/**
 * Wait until there's enough capacity in the current minute window
 * to send a batch with the given estimated token count.
 */
export async function waitForCapacity(provider, estimatedTokens, customTpmLimit = null, customRpmLimit = null) {
  const currentTpmLimit = customTpmLimit || TPM_LIMIT;
  const currentRpmLimit = customRpmLimit || RPM_LIMIT;

  while (true) {
    const { tokens, requests, window } = getWindowUsage(provider);

    const tokensFit = tokens + estimatedTokens <= currentTpmLimit;
    const requestsFit = requests + 1 <= currentRpmLimit;

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
      ? `TPM (${tokens.toLocaleString()}/${currentTpmLimit.toLocaleString()} used)`
      : `RPM (${requests}/${currentRpmLimit} used)`;

    console.log(`⏳ Rate limit (${provider}): waiting ${waitSec}s for ${reason} to reset...`);

    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}

/**
 * Record actual token usage after an API call completes.
 * Uses the real token count from the API response, not estimates.
 */
export function recordUsage(provider, actualTokens) {
  if (!windows[provider]) windows[provider] = [];
  windows[provider].push({
    timestamp: Date.now(),
    tokens: actualTokens,
  });
}

/**
 * Log rate limit info from response headers based on provider.
 */
export function logHeaders(headers, provider = "groq") {
  const remaining = headers.get('x-ratelimit-remaining-tokens') || headers.get('ratelimit-remaining-tokens');
  const reset = headers.get('x-ratelimit-reset-tokens') || headers.get('ratelimit-reset-tokens');
  if (remaining !== null && remaining !== undefined) {
    console.log(`   📊 ${provider.toUpperCase()} TPM remaining: ${remaining}, resets in: ${reset || '?'}`);
  }
}
