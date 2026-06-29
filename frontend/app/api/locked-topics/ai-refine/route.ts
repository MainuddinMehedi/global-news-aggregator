import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// This route is for refining the users topic and context for getting the users intent and better searchablity.
// applied in the topic creation modal at step 3.

const PRIMARY_CONFIG = {
  baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.AI_UTILITY_MODEL,
  provider: "groq",
};

// Fallback: Gemini Flash Lite — if Groq quota is exhausted or unavailable
const FALLBACK_CONFIG = {
  baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.AI_UTILITY_FALLBACK_MODEL,
  provider: "gemini",
};

async function requestAI(
  config: typeof PRIMARY_CONFIG,
  prompt: string,
): Promise<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`${config.provider} request failed (${res.status})`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName, userContext } = await req.json();

    const prompt = `You are an expert news researcher and intelligence analyst. A user wants to track a specific topic.
USER INTENT: "${userContext}"
DISPLAY NAME: "${displayName}"

TASK:
1. Generate an OPTIMIZED boolean search query (aiRefinedQuery) that can be used across Google News, Brave Search, and Reddit.
   - The query MUST follow a strict nested AND structure to balance high-recall and precision:
     (Core Subject Terms) AND (Evaluation/Performance/Key Synonyms) AND (Conversational/Context/Competitor/Application Synonyms)
   - Do NOT just search for rigid academic or marketing keywords. Include conversational synonyms that are used in informal settings or social media (e.g. use "prod", "production", "coding", "workflow", "app", "experience", "thoughts", "tweak", "vs" alongside formal terms like "benchmark", "case study", "performance").
   - Example structure for tracking a model performance:
     ("Deepseek v4" OR "Deepseek-v4") AND (performance OR benchmark OR test OR speed OR vs OR compare) AND ("real world" OR prod OR production OR coding OR app OR thoughts OR experience OR "use case" OR Gemini OR Claude)
2. Generate SEMANTIC CONCEPT BUCKETS (conceptualKeywords). This is an array of string arrays.
   - Each inner array is a "concept bucket".
   - LOGIC: Terms INSIDE a bucket are AND-ed (must all match). Buckets are OR-ed (any bucket match = pass).
   - TASK: Create several short buckets (1-2 terms each) to capture "signals behind the noise", synonyms, and related technologies.
   - Example for "Nvidia B200": [["Blackwell"], ["B200"], ["Vera Rubin"], ["Nvidia", "AI Factory"], ["Nvidia", "Azure"]]
   - This allows high recall while keeping signal sharp. Avoid buckets with 3+ terms unless they are a mandatory exact phrase.
3. Distill the user's true underlying research goal and intention (AI Query Summary).
   - Do NOT just summarize their literal words. Read between the lines to figure out what they are actually trying to achieve or the "feeling" they are looking for.
   - Remove all rambling, filler words, or personal venting.
   - Expand on their unexpressed goals. If they ask about "OpenAI drama", distill the intent to: "Tracking executive leadership conflicts, safety vs commercialization debates, and organizational instability at OpenAI."
   - Keep it to 1-2 sharp, highly descriptive sentences that capture the pure semantic core of their desire.
4. Identify 1-3 specific high-signal sources (RSS feeds, subreddits, or unique webpages).
   - CRITICAL: AI data can be stale. Do NOT invent or guess exact RSS XML paths if you are unsure.
   - If you recommend a publication but don't know the exact RSS URL, provide the homepage URL and append " (Find RSS)" to the label. This serves as a cue for the user to visit the site and find the correct feed themselves.

OUTPUT FORMAT (JSON ONLY, no markdown):
{
  "aiRefinedQuery": "string",
  "conceptualKeywords": [["term1", "term2"], ["term3"]],
  "aiQuerySummary": "string",
  "suggestedSources": [
    { "type": "rss|reddit|webpage", "label": "string", "url": "string" }
  ]
}

Ensure suggestedSources have valid public URLs if possible.`;

    let raw: string;

    try {
      raw = await requestAI(PRIMARY_CONFIG, prompt);
    } catch (primaryErr) {
      console.warn(
        `⚠️ Primary (${PRIMARY_CONFIG.provider}/${PRIMARY_CONFIG.model}) failed, switching to fallback (${FALLBACK_CONFIG.provider}/${FALLBACK_CONFIG.model})...`,
        primaryErr,
      );
      raw = await requestAI(FALLBACK_CONFIG, prompt);
    }

    const content = JSON.parse(raw);
    return NextResponse.json(content);
  } catch (error) {
    console.error("AI Refine Error:", error);
    return NextResponse.json(
      { error: "Failed to refine topic" },
      { status: 500 },
    );
  }
}
