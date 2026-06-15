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
          : "https://generativelanguage.googleapis.com/v1beta",
        apiKey: process.env.GEMINI_API_KEY || "",
      });

    case "mistral":
      return createOpenAI({
        baseURL: process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1",
        apiKey: process.env.MISTRAL_API_KEY || "",
      });

    case "github":
      return createOpenAI({
        baseURL:
          process.env.GITHUB_MODELS_BASE_URL ||
          "https://models.github.ai/inference",
        apiKey: process.env.GITHUB_MODELS_API_KEY || "",
        fetch: async (input, init) => {
          if (init?.body && typeof init.body === "string") {
            try {
              const body = JSON.parse(init.body);
              if (
                body.stream_options &&
                typeof body.model === "string" &&
                body.model.toLowerCase().includes("mistral")
              ) {
                delete body.stream_options;
              }
              return fetch(input, {
                ...init,
                body: JSON.stringify(body),
              });
            } catch {
              return fetch(input, init);
            }
          }
          return fetch(input, init);
        },
      });

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
