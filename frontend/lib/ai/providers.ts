import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { type ProviderName } from "./modelRegistry";

/**
 * AI Provider Client Factory
 * Centralizes the configuration for different LLM providers.
 */
export function createProviderClient(provider: ProviderName) {
  switch (provider) {
    case "groq":
      return createOpenAI({
        baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY || "",
      });

    case "google":
      return createGoogleGenerativeAI({
        baseURL: process.env.GEMINI_BASE_URL
          ? process.env.GEMINI_BASE_URL.replace(/\/openai$/, "")
          : undefined,
        apiKey: process.env.GEMINI_API_KEY || "",
      });

    case "github":
      return createOpenAI({
        baseURL:
          process.env.GITHUB_MODELS_BASE_URL || "https://models.github.ai/inference",
        apiKey: process.env.GITHUB_MODELS_API_KEY || "",
      });

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
