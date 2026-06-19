/**
 * Stage 2 Enrichment Module
 *
 * Invokes generative LLM APIs to perform named entity extraction, tone sentiment scoring,
 * and dynamic narrative bias analysis.
 */

import { requestAI } from "../ai/requestAI.js";
import { primaryConfig } from "../ai/aiConfig.js";
import {
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentPrompt,
} from "./prompts/enrichment.js";
import { countTokens } from "../ai/tokenBatcher.js";
import { logAiUsage } from "../utils/logAiUsage.js";

/**
 * Enriches a batch of raw articles using generative LLM API.
 *
 * @param {Array} articles - Array of raw articles (which have eventRegion attached).
 * @param {Array} categories - Array of Stage 1 categories mapped 1-to-1 with the articles.
 * @param {Object} config - Active AI Configuration.
 * @returns {Promise<Array>} Array of articles with dynamic entities, sentiment, bias notes, and model info.
 */
export async function enrichWithStage2Batch(articles, categories, config = primaryConfig) {
  if (!articles || articles.length === 0) return [];

  // Construct the prompt using the modular prompts system
  const prompt = `${ENRICHMENT_SYSTEM_PROMPT}\n\n${buildEnrichmentPrompt(articles, categories, config)}`;

  // Calculate tokens
  const rawInputTokens = countTokens(prompt);
  const estimatedTokens = Math.ceil(
    (rawInputTokens + config.reservedOutputTokens) * config.tokenMultiplier,
  );

  try {
    const response = await requestAI(config, prompt, estimatedTokens);

    await logAiUsage(
      response.provider,
      response.model,
      response.tokensUsed,
      0.0006,
    );

    let enrichments = [];
    let parseFailed = false;
    try {
      // Strips any potential markdown blocks wrapper
      const jsonText = response.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);
      enrichments = parsed.enrichments || [];
      if (enrichments.length === 0) {
        parseFailed = true;
      }
    } catch (parseErr) {
      parseFailed = true;
      console.warn(
        "⚠️ Stage 2 Enrichment failed to parse JSON response from LLM:",
        parseErr.message,
      );
      console.log("Raw LLM output was:", response.content);
    }

    return articles.map((article, index) => {
      const enrichment = enrichments[index] || {};
      const failed = parseFailed || Object.keys(enrichment).length === 0;

      return {
        ...article,
        entities: Array.isArray(enrichment.entities) ? enrichment.entities : [],
        // If LLM fails or doesn't return a field, default to null
        sentimentScore:
          typeof enrichment.sentimentScore === "number"
            ? enrichment.sentimentScore
            : null,
        biasNote:
          typeof enrichment.biasNote === "string" ? enrichment.biasNote : null,
        model: response.model || "unknown-llm",
        failedEnrichment: failed,
      };
    });
  } catch (err) {
    console.warn(
      `⚠️ Stage 2 Enrichment API call failed: ${err.message}. Gracefully falling back to empty fields.`,
    );

    return articles.map((article) => ({
      ...article,
      entities: [],
      sentimentScore: null,
      biasNote: null,
      model: "failed-api-fallback",
      failedEnrichment: true,
    }));
  }
}
