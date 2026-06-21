import { embed } from "ai";
import { createProviderClient } from "./providers";
import { GoogleGenerativeAIProvider } from "@ai-sdk/google";

const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Generates a 768-dimensional embedding vector for a given search query string.
 * Uses Google AI Studio's gemini-embedding-001 model via Vercel AI SDK.
 * 
 * @param query - The user search query string.
 * @returns 768-dimensional float array.
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Cannot generate embedding for an empty query");
  }

  try {
    const provider = createProviderClient("google");
    if (!provider || typeof (provider as any).textEmbeddingModel !== "function") {
      throw new Error("GoogleGenerativeAIProvider is not configured correctly or does not support textEmbeddingModel");
    }

    const google = provider as GoogleGenerativeAIProvider;
    const model = google.textEmbeddingModel(EMBEDDING_MODEL);

    const { embedding } = await embed({
      model,
      value: trimmed,
      providerOptions: {
        google: {
          outputDimensionality: 768,
        },
      },
    });

    return embedding;
  } catch (error) {
    console.error("❌ Failed to generate search query embedding:", error);
    throw new Error("Failed to generate query embedding");
  }
}
