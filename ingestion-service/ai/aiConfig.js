/**
 * Ingestion Service AI Config
 *
 * Defines primary and fallback model configuration schemas, mapping variables from environment
 * parameters and providing defaults.
 */

export const primaryConfig = {
  baseUrl: process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1",
  apiKey: process.env.MISTRAL_API_KEY,
  model: process.env.AI_PIPELINE_MODEL || "mistral-small-2506",
  provider: "mistral",
  tpmLimit: parseInt(process.env.AI_MISTRAL_TPM_LIMIT) || 2250000,
  rpmLimit: parseInt(process.env.AI_MISTRAL_RPM_LIMIT) || 60,
  concurrencyLimit: parseInt(process.env.AI_MISTRAL_CONCURRENCY) || 5,
  batchSize: parseInt(process.env.AI_MISTRAL_BATCH_SIZE) || 10,
  tokenMultiplier: parseFloat(process.env.AI_MISTRAL_TOKEN_MULTIPLIER) || 1.1,
  maxArticleTokens: parseInt(process.env.AI_MISTRAL_MAX_ARTICLE_TOKENS) || 600,
  maxRequestTokens: parseInt(process.env.AI_MISTRAL_MAX_REQUEST_TOKENS) || 8000,
  reservedOutputTokens: parseInt(process.env.AI_MISTRAL_RESERVED_OUTPUT_TOKENS) || 1000,
};

export const fallbackConfig = {
  baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
  model:
    process.env.AI_PIPELINE_FALLBACK_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct",
  provider: "groq",
  tpmLimit: parseInt(process.env.AI_GROQ_TPM_LIMIT) || 30000,
  rpmLimit: parseInt(process.env.AI_GROQ_RPM_LIMIT) || 28,
  concurrencyLimit: parseInt(process.env.AI_GROQ_CONCURRENCY) || 1,
  batchSize: parseInt(process.env.AI_GROQ_BATCH_SIZE) || 5,
  tokenMultiplier: parseFloat(process.env.AI_GROQ_TOKEN_MULTIPLIER) || 1.4,
  maxArticleTokens: parseInt(process.env.AI_GROQ_MAX_ARTICLE_TOKENS) || 400,
  maxRequestTokens: parseInt(process.env.AI_GROQ_MAX_REQUEST_TOKENS) || 3500,
  reservedOutputTokens: parseInt(process.env.AI_GROQ_RESERVED_OUTPUT_TOKENS) || 800,
};

export let pauseAI = false;

export async function loadConfigOverrides(prisma) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ai_config" },
    });
    if (setting && setting.value) {
      const val = setting.value;
      if (val.primary) {
        Object.assign(primaryConfig, val.primary);
      }
      if (val.fallback) {
        Object.assign(fallbackConfig, val.fallback);
      }
      if (typeof val.pauseAI === "boolean") {
        pauseAI = val.pauseAI;
      }
    }
  } catch (err) {
    console.error("⚠️ Failed to load AI config overrides from database:", err.message);
  }
}

