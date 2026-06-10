/**
 * Overview Generator — AI-powered synthesis of a topic's findings.
 *
 * Uses Google AI Studio (gemma-4-31b by default) to avoid rate limit collisions
 * with the Groq-based ingestion/scoring pipeline.
 *
 * Triggers only when a topic has accumulated >= OVERVIEW_THRESHOLD findings.
 * Feeds high-signal finding titles + short summaries (token-efficient) to the LLM
 * and generates a 2-3 sentence situational overview.
 */

import { prisma } from "../db/prisma.js";

const OVERVIEW_THRESHOLD =
  parseInt(process.env.AI_OVERVIEW_THRESHOLD) || 10;
const OVERVIEW_DEFAULT_MAX =
  parseInt(process.env.AI_OVERVIEW_MAX_FINDINGS) || 60;

/**
 * Build a dedicated AI config for overview generation.
 * Uses Google AI Studio (Gemini/Gemma) by default to avoid colliding with Groq.
 */
function getOverviewConfig() {
  return {
    baseUrl: process.env.GEMINI_BASE_URL,
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.AI_OVERVIEW_MODEL || "gemma-4-31b",
    provider: "google",
  };
}

/**
 * Generate an AI-powered findings overview for a topic.
 *
 * Only runs if the topic has >= OVERVIEW_THRESHOLD findings.
 * Saves the result to `lockedTopic.liveSummary`.
 *
 * @param {object} topic - A LockedTopic record
 * @returns {string|null} The generated overview, or null if below threshold
 */
export async function generateOverview(topic) {
  // Count findings for this topic
  const findingCount = await prisma.topicFinding.count({
    where: { topicId: topic.id },
  });

  if (findingCount < OVERVIEW_THRESHOLD) {
    console.log(
      `   ⏳ [overview] Topic "${topic.displayName}" has ${findingCount}/${OVERVIEW_THRESHOLD} findings — skipping overview generation.`,
    );
    return null;
  }

  // Calculate dynamic take limit using a ratio (30% of findings, floor 20, cap OVERVIEW_DEFAULT_MAX)
  const targetCount = Math.min(
    Math.max(20, Math.ceil(findingCount * 0.3)),
    OVERVIEW_DEFAULT_MAX
  );

  // Fetch top findings by relevance (high-signal items only)
  const topFindings = await prisma.topicFinding.findMany({
    where: { topicId: topic.id },
    orderBy: [{ relevanceScore: "desc" }, { foundAt: "desc" }],
    take: targetCount,
    select: {
      title: true,
      summary: true,
      sourceName: true,
      relevanceScore: true,
      foundAt: true,
    },
  });

  // Build a compact context string for the LLM (title + truncated summary)
  const findingsContext = topFindings
    .map((f, i) => {
      const shortSummary = f.summary
        ? f.summary.substring(0, 120).replace(/\s+/g, " ").trim()
        : "No summary";
      return `[${i + 1}] ${f.title} (${f.sourceName}) — ${shortSummary}`;
    })
    .join("\n");

  const prompt = `You are an intelligence analyst. Based on the following ${topFindings.length} high-signal findings for the tracking topic "${topic.displayName}", generate a concise situational overview.

TOPIC: "${topic.displayName}"
USER CONTEXT: "${topic.userContext || "None provided"}"

TOP FINDINGS (ordered by relevance):
${findingsContext}

TASK:
Write a 2-3 sentence situational overview that synthesizes the current state of this topic based on these findings. Focus on:
- The dominant narrative or trend
- Any emerging developments or shifts
- The overall trajectory (escalating, stable, resolving)

Be direct, analytical, and avoid hedging. Write as if briefing a decision-maker.

Return ONLY the overview text, no JSON, no markdown, no labels. Just the plain text overview.`;

  const config = getOverviewConfig();

  console.log(
    `🧠 [overview] Generating overview for "${topic.displayName}" (${topFindings.length} high-signal findings, using ${config.model})...`,
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Global News Aggregator — Overview",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after") || 60;
      console.warn(
        `⚠️ [overview] Rate limited by ${config.provider}. Would retry in ${retryAfter}s — skipping this cycle.`,
      );
      return null;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `❌ [overview] ${config.provider} API error ${res.status}: ${errorText}`,
      );
      return null;
    }

    const data = await res.json();
    const overview =
      data.choices?.[0]?.message?.content?.trim() || null;

    if (!overview) {
      console.warn(`⚠️ [overview] Empty response from ${config.model}.`);
      return null;
    }

    // Save to database
    await prisma.lockedTopic.update({
      where: { id: topic.id },
      data: { liveSummary: overview },
    });

    // Log AI usage
    try {
      const tokensUsed = data.usage?.total_tokens || 0;
      const today = new Date().toISOString().split("T")[0];
      const costPer1k = 0.0; // Free tier

      await prisma.aiUsage.create({
        data: {
          date: today,
          provider: config.provider,
          model: config.model,
          tokensUsed,
          estimatedCost: (tokensUsed / 1000) * costPer1k,
          success: true,
        },
      });
    } catch (usageErr) {
      console.error(
        `⚠️ [overview] Failed to log AI usage:`,
        usageErr.message,
      );
    }

    console.log(
      `   ✨ [overview] Generated overview: "${overview.substring(0, 80)}..."`,
    );
    return overview;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(
        `❌ [overview] Request timed out for "${topic.displayName}".`,
      );
    } else {
      console.error(
        `❌ [overview] Failed to generate overview:`,
        err.message,
      );
    }
    return null;
  }
}
