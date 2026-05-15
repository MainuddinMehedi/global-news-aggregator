import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

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

function estimateRequestSize(systemPrompt: string, coreMessages: Array<{ role: string; content: unknown }>) {
  return Buffer.byteLength(
    JSON.stringify({
      system: systemPrompt,
      messages: coreMessages.map((msg) => ({
        role: msg.role,
        content: String(msg.content),
      })),
    }),
    "utf8",
  );
}

type IncomingMessage = {
  role: string;
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
};

type IncomingContextItem = {
  title: string;
  type: string;
  url?: string;
};

export async function POST(req: Request) {
  try {
    const { messages, contexts, model = "groq/compound" } = (await req.json()) as {
      messages: IncomingMessage[];
      contexts?: IncomingContextItem[];
      model?: string;
    };

    let systemPrompt = SYSTEM_PROMPT;
    if (contexts?.length) {
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

    const hasImageParts = messages.some((msg) =>
      msg.parts?.some((p) => p.type === "file"),
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

    const coreMessages: ModelMessage[] = messages.map((msg) => {
      const role =
        msg.role === "user" || msg.role === "assistant" || msg.role === "system"
          ? msg.role
          : "user";
      const content = msg.parts
        ? msg.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text || "")
            .join("\n")
        : msg.content || "";

      return {
        role,
        content,
      };
    });

    const MAX_TOTAL_CHARS = model.startsWith("groq") ? 30_000 : 80_000;
    const MAX_TURNS = model.startsWith("groq") ? 6 : 12;

    while (coreMessages.length > MAX_TURNS) {
      coreMessages.splice(0, 2);
    }

    let totalChars = systemPrompt.length + coreMessages.reduce((s, m) => s + m.content.length, 0);
    while (totalChars > MAX_TOTAL_CHARS && coreMessages.length > 4) {
      coreMessages.splice(0, 2);
      totalChars = systemPrompt.length + coreMessages.reduce((s, m) => s + m.content.length, 0);
    }

    const requestSize = estimateRequestSize(systemPrompt, coreMessages);
    console.log("DEBUG: Sending to streamText", {
      model,
      msgCount: coreMessages.length,
      totalChars,
      requestSize,
    });

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: () => ({ model }),
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const errObj = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
    const message =
      typeof errObj.message === "string"
        ? errObj.message
        : "Failed to process chat request.";
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
