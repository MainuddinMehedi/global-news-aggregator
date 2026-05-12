import { NextRequest, NextResponse } from "next/server";

// This route is for refining the users topic and context for getting the users intent and better searchablity.
// applied in the topic creation modal at step 3.

const PRIMARY_CONFIG = {
  baseUrl: process.env.GROQ_BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.AI_UTILITY_MODEL,
  provider: "groq",
};

// Fallback: Gemini Flash Lite — if Groq quota is exhausted or unavailable
const FALLBACK_CONFIG = {
  baseUrl: process.env.GEMINI_BASE_URL,
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.AI_GEMINI_FALLBACK_MODEL,
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
    const { displayName, userContext } = await req.json();

    const prompt = `You are an expert news researcher. A user wants to track a specific topic.
USER INTENT: "${userContext}"
DISPLAY NAME: "${displayName}"

TASK:
1. Generate an OPTIMIZED search query (keyword based) that can be used across Google News, Brave Search, and Reddit to find matches for this intent. Use advanced search operators if helpful (OR, quotes). Keep it concise but high recall.
2. Summarize the user's intent in one short, sharp sentence (AI Query Summary).
3. Identify 1-3 specific high-signal sources (RSS feeds, specific subreddits, or unique webpages) that would be ideal for this tracker.

OUTPUT FORMAT (JSON ONLY, no markdown):
{
  "aiRefinedQuery": "string",
  "aiQuerySummary": "string",
  "suggestedSources": [
    { "type": "rss|reddit|webpage", "label": "string", "url": "string" }
  ]
}

Ensure suggestedSources have valid public URLs if possible (e.g. subreddits should be r/name or reddit.com/r/name).`;

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
