/**
 * Relevance Scorer — Evaluates findings against the topic's intent using AI.
 */

import { requestAI, primaryConfig } from "../ai/client.js";
import { prisma } from "../db/prisma.js"; // For AiUsage logging if needed, though client.js might log it? No, client.js logs to AiUsage? Wait, let's check what client.js logs.
// Ah, client.js doesn't write to DB for AiUsage, it just returns tokensUsed.
// The processor.js writes to AiUsage. So scorer.js should write to AiUsage.

export async function scoreFindings(topic, findings) {
  if (findings.length === 0) return findings;

  const BATCH_SIZE = 20;
  const query = topic.aiRefinedQuery || topic.displayName;

  console.log(
    `🧠 [scorer] Scoring ${findings.length} findings against topic: "${topic.displayName}" (using batches of ${BATCH_SIZE})...`,
  );

  for (let i = 0; i < findings.length; i += BATCH_SIZE) {
    const batch = findings.slice(i, i + BATCH_SIZE);
    const findingTitles = batch.map((f, index) => {
      const safeSummary = f.summary
        ? f.summary.substring(0, 500).replace(/\s+/g, " ").trim()
        : "No summary available";
      return `[${index}] Title: ${f.title}\n    Summary: ${safeSummary}`;
    });

    const prompt = `Given this search topic: "${query}", rate how relevant each finding is on a scale of 0.0 to 1.0 based on its title and summary.
  A score of 1.0 means it is highly relevant and exactly matches the topic.
  A score of 0.0 means it is completely irrelevant.
  Return ONLY a valid JSON object with a single key "scores" containing an array of numbers in the same order as the input.

  Findings:
  ${findingTitles.join("\n")}`;

    try {
      const aiResponse = await requestAI(primaryConfig, prompt);

      // Parse the JSON array
      let scores = [];
      try {
        const parsed = JSON.parse(aiResponse.content);
        scores = parsed.scores || [];
      } catch (e) {
        console.warn(
          `⚠️ [scorer] Batch ${i / BATCH_SIZE + 1} failed to parse JSON.`,
        );
      }

      if (Array.isArray(scores) && scores.length === batch.length) {
        batch.forEach((finding, j) => {
          let score = parseFloat(scores[j]);
          if (isNaN(score)) score = null;
          else if (score > 1) score = 1;
          else if (score < 0) score = 0;
          finding.relevanceScore = score;
        });
      } else {
        console.warn(
          `⚠️ [scorer] Batch ${i / BATCH_SIZE + 1} mismatch: got ${scores.length} scores for ${batch.length} items.`,
        );
      }

      // Log AI Usage
      try {
        const today = new Date().toISOString().split("T")[0];
        const costPer1k = 0.0002;
        const estimatedCost = (aiResponse.tokensUsed / 1000) * costPer1k;

        await prisma.aiUsage.create({
          data: {
            date: today,
            provider: aiResponse.provider,
            model: aiResponse.model,
            tokensUsed: aiResponse.tokensUsed,
            estimatedCost: estimatedCost,
            success: true,
          },
        });
      } catch (usageErr) {
        console.error(`⚠️ [scorer] Failed to log AI usage:`, usageErr.message);
      }
    } catch (err) {
      console.error(
        `❌ [scorer] Batch ${i / BATCH_SIZE + 1} failed:`,
        err.message,
      );
    }
  }

  return findings;
}
