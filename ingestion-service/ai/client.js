import { waitForCapacity, recordUsage, logHeaders } from "./rateLimiter.js";
import { countTokens, TOKEN_MULTIPLIER } from "./tokenBatcher.js";

export const primaryConfig = {
  baseUrl: process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1",
  apiKey: process.env.MISTRAL_API_KEY,
  model:
    process.env.AI_INGESTION_MODEL &&
    !process.env.AI_INGESTION_MODEL.includes("llama")
      ? process.env.AI_INGESTION_MODEL
      : "mistral-small-2506",
  provider: "mistral",
  tpmLimit: parseInt(process.env.AI_MISTRAL_TPM_LIMIT) || 2250000,
};

const fallbackConfig = {
  baseUrl: process.env.GROQ_BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
  model:
    process.env.AI_INGESTION_FALLBACK_MODEL &&
    process.env.AI_INGESTION_FALLBACK_MODEL.includes("llama")
      ? process.env.AI_INGESTION_FALLBACK_MODEL
      : "meta-llama/llama-4-scout-17b-16e-instruct",
  provider: "groq",
  tpmLimit: parseInt(process.env.AI_TPM_LIMIT) || 30000,
};

export async function requestAI(
  config,
  prompt,
  estimatedTokens = null,
  retries = 0,
) {
  // Graceful redirection if primary API key is missing
  if (config === primaryConfig && !config.apiKey) {
    if (fallbackConfig.apiKey) {
      console.warn(
        `⚠️ Primary provider (${primaryConfig.provider}) API key is missing. Redirecting request directly to fallback (${fallbackConfig.provider}/${fallbackConfig.model})...`,
      );
      return requestAI(fallbackConfig, prompt, estimatedTokens, retries);
    }
    throw new Error(
      "❌ Both primary and fallback AI API keys are missing from configuration.",
    );
  }

  try {
    // If no explicit token estimate is provided, use a generic safe estimate
    const tokensToWait =
      estimatedTokens ||
      Math.ceil((countTokens(prompt) + 1000) * TOKEN_MULTIPLIER);
    await waitForCapacity(tokensToWait, config.tpmLimit);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      parseInt(process.env.AI_TIMEOUT_MS) || 60000,
    );

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Global News Aggregator",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }, // Force JSON output
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle rate limits
    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after") || 5;
      console.warn(
        `⚠️ Rate limited by ${config.provider}. Waiting ${retryAfter}s...`,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      if (retries < (parseInt(process.env.AI_RETRY_ATTEMPTS) || 2)) {
        return requestAI(config, prompt, estimatedTokens, retries + 1);
      }
      throw new Error("Rate limit exceeded after retries");
    }

    if (!res.ok)
      throw new Error(`API Error ${res.status}: ${await res.text()}`);

    // Log rate limit headers based on provider
    logHeaders(res.headers, config.provider);

    const data = await res.json();
    const actualTokens = data.usage?.total_tokens || 0;

    // Record actual usage in the rate limiter window
    recordUsage(actualTokens);

    return {
      content: data.choices[0].message.content,
      model: data.model || config.model,
      provider: config.provider,
      tokensUsed: actualTokens,
    };
  } catch (err) {
    if (config === primaryConfig && fallbackConfig.apiKey) {
      console.warn(
        `⚠️ Primary (${primaryConfig.provider}/${primaryConfig.model}) failed, switching to fallback (${fallbackConfig.provider}/${fallbackConfig.model})... Error: ${err.message}`,
      );
      return requestAI(fallbackConfig, prompt, estimatedTokens, 0);
    }
    throw err;
  }
}
