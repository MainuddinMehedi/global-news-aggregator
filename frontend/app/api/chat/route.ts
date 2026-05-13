import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const groq = createOpenAI({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const google = createGoogleGenerativeAI({
  baseURL: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
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
    const { messages, contexts, model = "compound" } = await req.json();

    let systemPrompt = SYSTEM_PROMPT;
    if (contexts?.length > 0) {
      const contextBlock = contexts
        .map((c: { title: string; type: string; url?: string }) =>
          `- [${c.type}] "${c.title}"${c.url ? ` (${c.url})` : ""}`
        )
        .join("\n");
      systemPrompt += `\n\nThe user has attached the following context items for this conversation:\n${contextBlock}\nUse these to ground your analysis.`;
    }

    let aiModel;
    if (model.startsWith("gemini")) {
      aiModel = google(model);
    } else {
      // Route everything else to Groq, stripping 'groq/' prefix if provided
      const actualModel = model.replace("groq/", "");
      aiModel = groq.chat(actualModel);
    }

    const coreMessages = messages.map((msg: any) => {
      const content = msg.parts 
        ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("\n")
        : msg.content || "";
        
      return {
        role: msg.role,
        content
      };
    });

    console.log("DEBUG: Sending to streamText", { model, coreMessages });

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat request." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
