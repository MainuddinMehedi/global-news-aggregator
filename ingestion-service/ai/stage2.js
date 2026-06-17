/**
 * Stage 2 Enrichment Module
 * 
 * Invokes generative LLM APIs to perform named entity extraction, tone sentiment scoring,
 * and dynamic narrative bias analysis.
 */

import { requestAI } from "./requestAI.js";
import { primaryConfig } from "../config/ai.js";
import { ENRICHMENT_SYSTEM_PROMPT, buildEnrichmentPrompt } from "./prompts/enrichment.js";
import { countTokens, TOKEN_MULTIPLIER } from "./tokenBatcher.js";
import { logAiUsage } from "../utils/logAiUsage.js";

/**
 * Enriches a batch of raw articles using generative LLM API.
 * 
 * @param {Array} articles - Array of raw articles (which have eventRegion attached).
 * @param {Array} categories - Array of Stage 1 categories mapped 1-to-1 with the articles.
 * @returns {Promise<Array>} Array of articles with dynamic entities, sentiment, bias notes, and model info.
 */
export async function enrichWithStage2Batch(articles, categories) {
  if (!articles || articles.length === 0) return [];

  // Construct the prompt using the modular prompts system
  const prompt = `${ENRICHMENT_SYSTEM_PROMPT}\n\n${buildEnrichmentPrompt(articles, categories)}`;
  
  // Calculate tokens (articles.length * 400 represents output token reserve for entities + bias note per article)
  const rawInputTokens = countTokens(prompt);
  const estimatedTokens = Math.ceil(
    (rawInputTokens + (articles.length * 400)) * TOKEN_MULTIPLIER
  );

  try {
    const response = await requestAI(primaryConfig, prompt, estimatedTokens);

    await logAiUsage(response.provider, response.model, response.tokensUsed, 0.0006);
    
    let enrichments = [];
    try {
      // Strips any potential markdown blocks wrapper
      const jsonText = response.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);
      enrichments = parsed.enrichments || [];
    } catch (parseErr) {
      console.warn("⚠️ Stage 2 Enrichment failed to parse JSON response from LLM:", parseErr.message);
      console.log("Raw LLM output was:", response.content);
    }

    return articles.map((article, index) => {
      const enrichment = enrichments[index] || {};
      
      return {
        ...article,
        entities: Array.isArray(enrichment.entities) ? enrichment.entities : [],
        // If LLM fails or doesn't return a field, default to null
        sentimentScore: typeof enrichment.sentimentScore === "number" ? enrichment.sentimentScore : null,
        biasNote: typeof enrichment.biasNote === "string" ? enrichment.biasNote : null,
        model: response.model || "unknown-llm",
      };
    });
  } catch (err) {
    console.warn(`⚠️ Stage 2 Enrichment API call failed: ${err.message}. Gracefully falling back to empty fields.`);
    
    return articles.map(article => ({
      ...article,
      entities: [],
      sentimentScore: null,
      biasNote: null,
      model: "failed-api-fallback",
    }));
  }
}
