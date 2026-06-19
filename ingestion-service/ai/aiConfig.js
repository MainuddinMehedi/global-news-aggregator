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
};
