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
  const topicName = topic.displayName;
  const userIntent = topic.userContext || "None provided";
  const conceptSummary = topic.aiQuerySummary || "None provided";
  const booleanQuery = topic.aiRefinedQuery || "None provided";

  console.log(
    `🧠 [scorer] Scoring ${findings.length} findings against topic: "${topicName}" (using batches of ${BATCH_SIZE})...`,
  );

  for (let i = 0; i < findings.length; i += BATCH_SIZE) {
    const batch = findings.slice(i, i + BATCH_SIZE);
    const findingTitles = batch.map((f, index) => {
      const safeSummary = f.summary
        ? f.summary.substring(0, 500).replace(/\s+/g, " ").trim()
        : "No summary available";
      return `[${index}] Title: ${f.title}\n    Summary: ${safeSummary}`;
    });

    const prompt = `You are an AI research assistant and intelligence analyst. Given the following tracking topic and context, evaluate the relevance of each finding on a scale of 0.0 to 1.0 based on its title and summary.

TRACKING TOPIC DETAILS:
- Topic Title: "${topicName}"
- User Intent/Context: "${userIntent}"
- AI Refined Concept: "${conceptSummary}"
- Boolean Query Filter: "${booleanQuery}"

SCORING RULES:
- A score of 1.0 means the finding directly and perfectly matches the user's intent or tracking topic.
- A score of 0.5 to 0.9 means it is highly relevant, discussing the same concepts, news, or technologies.
- A score of 0.1 to 0.4 means it is weakly relevant or tangentially related.
- A score of 0.0 means it is completely irrelevant or off-topic.

You must return a valid JSON object containing a "results" array. Each item in the array must have the "index" (number), "score" (number), and a short "reason" (string).
Output format:
{
  "results": [
    { "index": 0, "score": 0.95, "reason": "Directly compares DeepSeek v4 Pro coding benchmarks with Claude 3.5." }
  ]
}

Findings to evaluate:
${findingTitles.join("\n")}`;

    try {
      const aiResponse = await requestAI(primaryConfig, prompt);

      // Parse the JSON array
      let results = [];
      try {
        const parsed = JSON.parse(aiResponse.content);
        results = parsed.results || [];
      } catch (e) {
        console.warn(
          `⚠️ [scorer] Batch ${i / BATCH_SIZE + 1} failed to parse JSON.`,
        );
      }

      // Map scores by index to guarantee correct pairing
      const scoreMap = new Map();
      if (Array.isArray(results)) {
        for (const res of results) {
          if (res && typeof res.index === "number") {
            scoreMap.set(res.index, parseFloat(res.score));
          }
        }
      }

      // Assign scores to the batch, defaulting to 0.0 if the AI missed the index
      batch.forEach((finding, j) => {
        let score = scoreMap.has(j) ? scoreMap.get(j) : 0.0;
        if (isNaN(score) || score === undefined || score === null) score = 0.0;
        else if (score > 1) score = 1.0;
        else if (score < 0) score = 0.0;
        finding.relevanceScore = score;
      });

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
