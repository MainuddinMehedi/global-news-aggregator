import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PRIMARY_CONFIG = {
  baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.AI_SUMMARY_MODEL || "gemma-4-31b",
  provider: "gemini",
};

const FALLBACK_CONFIG = {
  baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.AI_UTILITY_FALLBACK_MODEL || "gemini-3.1-flash-lite",
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
    }),
  });

  if (!res.ok) {
    throw new Error(`${config.provider} request failed (${res.status})`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const topic = await prisma.lockedTopic.findUnique({
      where: { id },
      include: {
        findings: {
          orderBy: { foundAt: "desc" },
          take: 50, // Grab up to 50 of the latest findings for context
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    if (topic.findings.length === 0) {
      return NextResponse.json({
        summary:
          "No findings were recorded for this topic during its lifecycle.",
      });
    }

    const findingTexts = topic.findings
      .map((f) => `- ${f.title} (${f.sourceName}): ${f.summary || ""}`)
      .join("\n");

    const prompt = `You are a geopolitical intelligence archivist. A user is archiving their tracking topic titled "${topic.displayName}".
Your task is to provide a final documented history of what happened regarding this topic during its lifecycle, as all underlying articles will be deleted to save space.

TOPIC INTENT: ${topic.aiQuerySummary}

LATEST FINDINGS (Up to 50):
${findingTexts}

Write a comprehensive, professional, 2-3 paragraph historical record of the major events, narrative shifts, and key takeaways from these findings. Make it read like a permanent historical document. Use markdown formatting.`;

    let summary: string;

    try {
      summary = await requestAI(PRIMARY_CONFIG, prompt);
    } catch (primaryErr) {
      console.warn(
        `⚠️ Primary (${PRIMARY_CONFIG.provider}/${PRIMARY_CONFIG.model}) failed, switching to fallback (${FALLBACK_CONFIG.provider}/${FALLBACK_CONFIG.model})...`,
        primaryErr,
      );
      summary = await requestAI(FALLBACK_CONFIG, prompt);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
