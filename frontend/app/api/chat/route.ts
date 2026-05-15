import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ModelMessage, type UIMessage } from "ai";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import {
  createSessionTitle,
  getMessageText,
  isInitialAssistantMessage,
} from "@/lib/chat/messages";
import type { ContextItem } from "@/components/chat/types";

const groq = createOpenAI({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

const google = createGoogleGenerativeAI({
  baseURL: process.env.GEMINI_BASE_URL
    ? process.env.GEMINI_BASE_URL.replace(/\/openai$/, "")
    : undefined,
  apiKey: process.env.GEMINI_API_KEY || "",
});

const github = createOpenAI({
  baseURL:
    process.env.GITHUB_MODELS_BASE_URL || "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_MODELS_API_KEY || "",
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

function estimateRequestSize(
  systemPrompt: string,
  coreMessages: Array<{ role: string; content: unknown }>,
) {
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
  id?: string;
  role: string;
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
  metadata?: unknown;
};

type IncomingContextItem = {
  id?: string;
  title: string;
  type: string;
  url?: string;
  sourceId?: string;
  sourceType?: string;
  snapshot?: unknown;
};

function toJsonInput(value: unknown) {
  return value === undefined || value === null
    ? undefined
    : (value as Prisma.InputJsonValue);
}

function toContextInput(context: IncomingContextItem) {
  return {
    ...context,
    id: context.id ?? context.sourceId ?? context.title,
    type: context.type,
  } as ContextItem;
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      contexts,
      model = "groq/compound-mini",
      adaptiveThinking = false,
      sessionId,
      responseMode = "descriptive",
    } = (await req.json()) as {
      messages: IncomingMessage[];
      contexts?: IncomingContextItem[];
      model?: string;
      adaptiveThinking?: boolean;
      sessionId?: string;
      responseMode?: "concise" | "descriptive";
    };

    const latestUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");
    const latestUserText = latestUserMessage
      ? latestUserMessage.parts
        ? latestUserMessage.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text || "")
            .join("\n")
            .trim()
        : latestUserMessage.content || ""
      : "";

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await prisma.chatSession.create({
        data: {
          title: createSessionTitle(latestUserText),
          model,
          responseMode,
        },
      });
      activeSessionId = session.id;
    } else {
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { model, responseMode },
      });
    }

    if (contexts?.length) {
      await prisma.chatContext.createMany({
        data: contexts.map((context) => ({
          sessionId: activeSessionId,
          ...normalizeContextForDb(toContextInput(context)),
        })),
        skipDuplicates: true,
      });
    }

    if (latestUserMessage && activeSessionId) {
      const userMessageId =
        latestUserMessage.id || `user-${Date.now().toString(36)}`;
      await prisma.chatMessage.upsert({
        where: { id: userMessageId },
        update: {
          text: latestUserText,
          parts: toJsonInput(
            latestUserMessage.parts || [{ type: "text", text: latestUserText }],
          ),
          metadata: toJsonInput(latestUserMessage.metadata),
        },
        create: {
          id: userMessageId,
          sessionId: activeSessionId,
          role: "user",
          text: latestUserText,
          parts: toJsonInput(
            latestUserMessage.parts || [{ type: "text", text: latestUserText }],
          ) as Prisma.InputJsonValue,
          metadata: toJsonInput(latestUserMessage.metadata),
        },
      });
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (responseMode === "concise") {
      systemPrompt +=
        "\n\nResponse mode: concise. Answer directly in a short, high-signal way unless the user asks for depth.";
    } else {
      systemPrompt +=
        "\n\nResponse mode: descriptive. Provide enough context, caveats, and geopolitical implications to be useful.";
    }

    if (contexts?.length) {
      const contextBlock = contexts
        .map((c) => {
          const snapshot =
            c.snapshot && typeof c.snapshot === "object"
              ? (c.snapshot as Record<string, unknown>)
              : null;
          const snippet =
            typeof snapshot?.contentSnippet === "string"
              ? `\n  Snippet: ${snapshot.contentSnippet}`
              : "";
          const source =
            typeof snapshot?.source === "string"
              ? `\n  Source: ${snapshot.source}`
              : "";
          const publishedAt =
            typeof snapshot?.publishedAt === "string"
              ? `\n  Published: ${snapshot.publishedAt}`
              : "";

          return `- [${c.type}] "${c.title}"${c.url ? ` (${c.url})` : ""}${source}${publishedAt}${snippet}`;
        })
        .join("\n");
      systemPrompt += `\n\nThe user has attached the following context items for this conversation:\n${contextBlock}\nUse these to ground your analysis.`;
    }

    let aiModel;
    const isGitHubModel = model.startsWith("github:");
    const isGoogleModel =
      model.startsWith("gemini") || model.startsWith("gemma");
    const isGroqHostedModel = !isGoogleModel && !isGitHubModel;

    if (isGitHubModel) {
      aiModel = github.chat(model.slice("github:".length));
    } else if (isGoogleModel) {
      aiModel = google.chat(model);
    } else {
      // Route all non-Gemini chat models through Groq's OpenAI-compatible API.
      aiModel = groq.chat(model);
    }

    const hasImageParts = messages.some((msg) =>
      msg.parts?.some((p) => p.type === "file"),
    );
    if (hasImageParts && !isGoogleModel) {
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

    const coreMessages: ModelMessage[] = messages
      .filter((msg) => {
        if (msg.id && msg.role === "assistant") {
          return !isInitialAssistantMessage({
            id: msg.id,
            role: "assistant",
            parts: msg.parts as UIMessage["parts"],
          });
        }
        return true;
      })
      .map((msg) => {
        const role =
          msg.role === "user" ||
          msg.role === "assistant" ||
          msg.role === "system"
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

    const MAX_TOTAL_CHARS = isGitHubModel
      ? 12_000
      : isGroqHostedModel
        ? 30_000
        : 80_000;
    const MAX_TURNS = isGitHubModel ? 6 : isGroqHostedModel ? 8 : 16;

    while (coreMessages.length > MAX_TURNS) {
      coreMessages.splice(0, 2);
    }

    let totalChars =
      systemPrompt.length +
      coreMessages.reduce((s, m) => s + m.content.length, 0);
    while (totalChars > MAX_TOTAL_CHARS && coreMessages.length > 4) {
      coreMessages.splice(0, 2);
      totalChars =
        systemPrompt.length +
        coreMessages.reduce((s, m) => s + m.content.length, 0);
    }

    const requestSize = estimateRequestSize(systemPrompt, coreMessages);
    console.log("DEBUG: Sending to streamText", {
      model,
      msgCount: coreMessages.length,
      totalChars,
      requestSize,
      adaptiveThinking,
    });

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: coreMessages,
      providerOptions:
        adaptiveThinking && model.startsWith("openai/gpt-oss")
          ? { openai: { reasoningEffort: "medium" } }
          : undefined,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      messageMetadata: () => ({ model, sessionId: activeSessionId }),
      onFinish: async ({ responseMessage, isAborted }) => {
        if (isAborted || !activeSessionId) return;

        try {
          const assistantText = getMessageText(responseMessage);
          const responseId =
            responseMessage.id || `msg-${Date.now().toString(36)}`;
          const parts = responseMessage.parts || [
            { type: "text", text: assistantText },
          ];

          await prisma.chatMessage.upsert({
            where: { id: responseId },
            update: {
              text: assistantText,
              parts: toJsonInput(parts),
              metadata: toJsonInput(responseMessage.metadata),
            },
            create: {
              id: responseId,
              sessionId: activeSessionId,
              role: "assistant",
              text: assistantText,
              parts: toJsonInput(parts) as Prisma.InputJsonValue,
              metadata: toJsonInput(responseMessage.metadata),
            },
          });

          await prisma.chatSession.update({
            where: { id: activeSessionId },
            data: {
              model,
              responseMode,
              title: latestUserText
                ? createSessionTitle(latestUserText)
                : undefined,
            },
          });
        } catch (err) {
          console.error("Error in onFinish background task:", err);
        }
      },
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const errObj =
      error && typeof error === "object"
        ? (error as Record<string, unknown>)
        : {};
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
