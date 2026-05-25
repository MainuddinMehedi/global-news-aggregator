import { streamText, stepCountIs, type ModelMessage, type UIMessage } from "ai";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import {
  createSessionTitle,
  getMessageText,
  isInitialAssistantMessage,
} from "@/lib/chat/messages";
import type { ContextItem } from "@/types/chat";
import { getModel } from "@/lib/ai/modelRegistry";
import { createProviderClient } from "@/lib/ai/providers";
import { webSearchTool, fetchUrlTool } from "@/lib/ai/tools";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a senior geopolitical analyst AI embedded in a global news aggregator.
Your role:
- Analyze geopolitical events, trends, and their implications
- Provide multi-perspective analysis (Western, Eastern, Global South viewpoints)
- Cite specific events, dates, and actors when possible
- Flag potential biases in narratives
- Be concise but thorough — prefer structured responses with headers and bullet points
- When using web search or URL fetching, read the tool results and synthesize a direct answer in your own words. Do not dump raw search results, URLs, or tool payloads as the answer.
- Limit yourself to a few targeted tool calls. Do not loop endlessly. Output a final text answer once you have enough information.
- Use sources as evidence for the answer; the UI will render references separately.
- Format answers in Markdown. Do not use raw HTML such as <br>; use paragraphs, bullets, or Markdown line breaks instead.

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

function getIncomingMessageText(message: IncomingMessage) {
  return message.parts
    ? message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("\n")
        .trim()
    : message.content || "";
}

function shouldForceWebSearch(
  latestUserText: string,
  messages: ModelMessage[],
) {
  const latest = latestUserText.toLowerCase();
  const recentContext = messages
    .slice(-6)
    .map((message) => String(message.content || ""))
    .join(" ")
    .toLowerCase();

  const asksForCurrentInfo =
    /\b(date|dates|schedule|fixture|fixtures|match|matches|play|playing|when|where|latest|today|tomorrow|upcoming)\b/.test(
      latest,
    );
  const hasSportsContext =
    /\b(world cup|fifa|football|soccer|argentina|fixture|fixtures|match|matches)\b/.test(
      `${latest} ${recentContext}`,
    );

  return asksForCurrentInfo && hasSportsContext;
}

function formatStreamError(error: unknown) {
  const errObj =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const message =
    typeof errObj.message === "string"
      ? errObj.message
      : "Failed to process chat request.";
  const code = typeof errObj.code === "string" ? errObj.code : "";
  const statusCode =
    typeof errObj.statusCode === "number" ? errObj.statusCode : undefined;

  if (
    statusCode === 413 ||
    code === "request_too_large" ||
    code === "rate_limit_exceeded" ||
    message.includes("Request Entity Too Large") ||
    message.includes("tokens per minute")
  ) {
    return "Request too large for the selected model's current token limit. Try the 20B model, ask a shorter follow-up, or wait for the token window to reset.";
  }

  return message;
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
      ? getIncomingMessageText(latestUserMessage)
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

    const modelConfig = getModel(model);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: `Model ${model} is not supported.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const provider = createProviderClient(modelConfig.provider);
    const aiModel = provider.chat(
      modelConfig.provider === "github" ? model.slice("github:".length) : model,
    );

    const hasImageParts = messages.some((msg) =>
      msg.parts?.some((p) => p.type === "file"),
    );
    if (hasImageParts && !modelConfig.capabilities.supportsImages) {
      return new Response(
        JSON.stringify({
          error: `The selected model ${modelConfig.label} does not support image input. Please switch to a supported model or remove images.`,
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
        if (msg.role === "assistant" && !getIncomingMessageText(msg).trim()) {
          return false;
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
        const content = getIncomingMessageText(msg);

        return {
          role,
          content,
        };
      });

    const MAX_TOTAL_CHARS = Math.floor(modelConfig.contextWindow * 3.5);
    const MAX_TURNS =
      modelConfig.provider === "groq"
        ? 4
        : modelConfig.contextWindow > 32000
          ? 16
          : 8;

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

    const tools = modelConfig.capabilities.supportsTools
      ? { web_search: webSearchTool, fetch_url: fetchUrlTool }
      : undefined;
    const forceWebSearch = Boolean(
      tools && shouldForceWebSearch(latestUserText, coreMessages),
    );

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: coreMessages,
      tools,
      stopWhen: stepCountIs(modelConfig.provider === "groq" ? 6 : 8),
      prepareStep: tools
        ? ({ stepNumber }) => {
            if (stepNumber === 0 && forceWebSearch) {
              return {
                activeTools: ["web_search"],
                toolChoice: { type: "tool", toolName: "web_search" },
              };
            }

            return undefined;
          }
        : undefined,
      providerOptions:
        adaptiveThinking && model.startsWith("openai/gpt-oss")
          ? { openai: { reasoningEffort: "medium" } }
          : undefined,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      messageMetadata: () => ({ model, sessionId: activeSessionId }),
      sendSources: true,
      onError: (error) => {
        console.error("Chat stream error:", error);
        return formatStreamError(error);
      },
      onFinish: async ({ responseMessage, isAborted }) => {
        if (isAborted || !activeSessionId) return;

        try {
          const assistantText = getMessageText(responseMessage);
          const hasToolCalls = responseMessage.parts?.some(
            (p) => p.type.startsWith("tool-") || p.type === "tool-invocation",
          );

          if (!assistantText && !hasToolCalls) {
            console.warn("Skipping empty assistant response", {
              sessionId: activeSessionId,
              model,
              parts: responseMessage.parts,
            });
            return;
          }

          const responseId =
            responseMessage.id || `msg-${Date.now().toString(36)}`;

          const fallbackText =
            "I gathered some information using tools, but encountered an issue synthesizing a final text response. Please try asking again or refining your query.";
          const finalParts = responseMessage.parts || [
            { type: "text", text: assistantText || fallbackText },
          ];

          if (!assistantText && hasToolCalls) {
            finalParts.push({ type: "text", text: fallbackText });
          }

          await prisma.chatMessage.upsert({
            where: { id: responseId },
            update: {
              text: assistantText || fallbackText,
              parts: toJsonInput(finalParts),
              metadata: toJsonInput(responseMessage.metadata),
            },
            create: {
              id: responseId,
              sessionId: activeSessionId,
              role: "assistant",
              text: assistantText || fallbackText,
              parts: toJsonInput(finalParts) as Prisma.InputJsonValue,
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
    const message = formatStreamError(error);
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
