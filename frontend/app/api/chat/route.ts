import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const groq = createOpenAI({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const google = createGoogleGenerativeAI({
  // baseURL:
  //   process.env.GEMINI_BASE_URL ||
  //   "https://generativelanguage.googleapis.com/v1beta",
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior geopolitical analyst AI embedded in a global news aggregator.
Your role:
- Analyze geopolitical events, trends, and their implications
- Provide multi-perspective analysis (Western, Eastern, Global South viewpoints)
- Cite specific events, dates, and actors when possible
- Flag potential biases in narratives
- Be concise but thorough — prefer structured responses with headers and bullet points

You have access to the user's context items (articles, topics) when provided.
Ground your analysis in the provided context when available.
If you don't have enough information, say so rather than speculating.`;

export async function POST(req: Request) {
  try {
    const { messages, contexts, model = "groq/compound" } = await req.json();

    let systemPrompt = SYSTEM_PROMPT;
    if (contexts?.length > 0) {
      const contextBlock = contexts
        .map(
          (c: { title: string; type: string; url?: string }) =>
            `- [${c.type}] "${c.title}"${c.url ? ` (${c.url})` : ""}`,
        )
        .join("\n");
      systemPrompt += `\n\nThe user has attached the following context items for this conversation:\n${contextBlock}\nUse these to ground your analysis.`;
    }

    let aiModel;
    if (model.startsWith("gemini")) {
      aiModel = google(model);
    } else {
      // Route everything else to Groq, stripping 'groq/' prefix if provided
      // const actualModel = model.replace("groq/", "");
      aiModel = groq.chat(model);
    }

    const hasImageParts = messages.some((msg: any) =>
      msg.parts?.some((p: any) => p.type === "file"),
    );
    if (hasImageParts && !model.startsWith("gemini")) {
      return new Response(
        JSON.stringify({
          error:
            "The selected model does not support image input. Please switch to a Gemini model or remove images.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const coreMessages = messages.map((msg: any) => {
      const content = msg.parts
        ? msg.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("\n")
        : msg.content || "";

      return {
        role: msg.role,
        content,
      };
    });

    const MAX_TOTAL_CHARS = 80_000;
    let totalChars = coreMessages.reduce((s: number, m: any) => s + m.content.length, 0);
    while (totalChars > MAX_TOTAL_CHARS && coreMessages.length > 4) {
      const removed = coreMessages.splice(0, 2);
      totalChars -= removed.reduce((s: number, m: any) => s + m.content.length, 0);
    }

    console.log("DEBUG: Sending to streamText", { model, msgCount: coreMessages.length, totalChars });

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: () => ({ model }),
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process chat request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
