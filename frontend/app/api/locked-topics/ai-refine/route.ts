import { NextRequest, NextResponse } from "next/server";

const AI_CONFIG = {
  baseUrl: process.env.AI_PRIMARY_BASE_URL,
  apiKey: process.env.AI_PRIMARY_API_KEY,
  model: process.env.AI_PRIMARY_MODEL,
};

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

    const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error("AI Request failed");

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(content);
  } catch (error) {
    console.error("AI Refine Error:", error);
    return NextResponse.json({ error: "Failed to refine topic" }, { status: 500 });
  }
}
