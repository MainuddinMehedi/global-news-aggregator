import { logAiUsage } from "../utils/logAiUsage.js";
import { embeddingConfig } from "./aiConfig.js";

/**
 * Generates embeddings for a batch of text strings in a single API call to conserve RPD limits.
 * Implements safety truncation, rate-limit retries, and returns null instead of zero-vectors for empty items.
 * 
 * @param {string[]} texts - Array of texts to embed.
 * @returns {Promise<(number[]|null)[]>} Array of 768-dimensional float arrays or nulls.
 */
export async function generateEmbeddingsBatch(texts) {
  if (!texts || texts.length === 0) return [];
  if (!embeddingConfig.apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  // Pre-process, truncate, and map texts
  // Max input length is 2,048 tokens. 8000 characters is safely under this.
  const processedInputs = texts.map(t => {
    const clean = (t || "").trim();
    return clean ? clean.slice(0, 8000) : null;
  });

  // Track valid items to batch send
  const validItems = [];
  for (let i = 0; i < processedInputs.length; i++) {
    if (processedInputs[i]) {
      validItems.push({ index: i, text: processedInputs[i] });
    }
  }

  // If no valid text, return all nulls
  if (validItems.length === 0) {
    return texts.map(() => null);
  }

  const inputsToSend = validItems.map(item => item.text);

  const nativeBaseUrl = embeddingConfig.baseUrl.replace(/\/openai$/, "");
  const modelName = embeddingConfig.model.startsWith("models/") 
    ? embeddingConfig.model 
    : `models/${embeddingConfig.model}`;
  const url = `${nativeBaseUrl}/${modelName}:batchEmbedContents?key=${embeddingConfig.apiKey}`;

  let attempts = 3;
  let delay = 1000;
  let res;

  while (attempts > 0) {
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: inputsToSend.map(text => ({
            model: modelName,
            content: {
              parts: [{ text }]
            },
            outputDimensionality: 768
          }))
        }),
      });

      if (res.status === 429) {
        attempts--;
        if (attempts === 0) throw new Error("Google Embeddings API rate limited: 429 Too Many Requests.");
        console.warn(`⚠️ Embeddings API rate limited (429). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      break; // Success or non-429 error
    } catch (fetchErr) {
      attempts--;
      if (attempts === 0) throw fetchErr;
      console.warn(`⚠️ Embeddings API request failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Embeddings API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (!data.embeddings || !Array.isArray(data.embeddings)) {
    throw new Error("Invalid response format from Google Embeddings API.");
  }

  // Reconstruct the output matching the original input array indexes
  const resultEmbeddings = texts.map(() => null);
  for (let k = 0; k < validItems.length; k++) {
    const originalIndex = validItems[k].index;
    const embedding = data.embeddings[k]?.values || null;
    resultEmbeddings[originalIndex] = embedding;
  }

  // Log AI Usage (estimate token count based on characters, roughly 4 chars = 1 token)
  const totalChars = inputsToSend.reduce((sum, t) => sum + t.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);
  await logAiUsage("google", embeddingConfig.model, estimatedTokens, 0.0);

  return resultEmbeddings;
}

/**
 * Generates embedding for a single text string.
 * 
 * @param {string} text - Text to embed.
 * @returns {Promise<number[]|null>} 768-dimensional float array or null.
 */
export async function generateEmbedding(text) {
  const result = await generateEmbeddingsBatch([text]);
  return result[0];
}
