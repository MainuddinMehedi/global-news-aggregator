import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  smoothStream,
  type ModelMessage,
  type UIMessage,
} from "ai";
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
- Analyze geopolitical events, trends, and their implications.
- Provide multi-perspective analysis (Western, Eastern, Global South viewpoints).
- Cite specific events, dates, and actors when possible.
- Be concise but thorough — prefer structured responses with headers and bullet points.

CRITICAL INSTRUCTIONS:
1. When you use tools (web search, URL fetch), you MUST provide a final, synthesized text answer in your own words based on the results.
2. NEVER end a response with a tool call or reasoning block alone. Always conclude with a "text" part containing your analysis.
3. If you have gathered enough information, stop using tools and provide your final verdict or summary.
4. Ground your analysis in the provided context items when available.`;

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

  // Groq specific debugging for tool_use_failed
  if (code === "tool_use_failed" || message.includes("failed_generation")) {
    const failedGeneration =
      (errObj as any).failed_generation ||
      (errObj as any).responseBody?.error?.failed_generation;

    if (failedGeneration) {
      console.error("GROQ FAILED GENERATION:", failedGeneration);
    } else {
      console.error(
        "GROQ TOOL ERROR OBJECT:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
    }
  }

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

    const coreMessages = await convertToModelMessages(
      messages.filter((msg) => {
        if (msg.id && msg.role === "assistant") {
          return !isInitialAssistantMessage({
            id: msg.id,
            role: "assistant",
            parts: msg.parts as UIMessage["parts"],
          });
        }
        // Keep assistant messages that have tool calls even if text is empty
        const hasToolCalls = msg.parts?.some(
          (p) => p.type === "tool-invocation" || p.type.startsWith("tool-"),
        );
        if (
          msg.role === "assistant" &&
          !getIncomingMessageText(msg).trim() &&
          !hasToolCalls
        ) {
          return false;
        }
        return true;
      }) as any,
    );

    const MAX_TURNS =
      modelConfig.provider === "groq"
        ? 4
        : modelConfig.contextWindow > 32000
          ? 16
          : 8;

    while (coreMessages.length > MAX_TURNS) {
      coreMessages.splice(0, 1); // Remove one by one to preserve system message if any
    }

    const requestSize = estimateRequestSize(systemPrompt, coreMessages as any);
    console.log("DEBUG: Sending to streamText", {
      model,
      msgCount: coreMessages.length,
      requestSize,
      adaptiveThinking,
    });

    const tools = modelConfig.capabilities.supportsTools
      ? { web_search: webSearchTool, fetch_url: fetchUrlTool }
      : undefined;

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const result = streamText({
      model: aiModel,
      system: `${systemPrompt}\n\nCurrent Date: ${today}`,
      messages: coreMessages,
      tools,
      // @ts-ignore - maxSteps is supported in modern AI SDK but type check may fail due to specific version mismatch
      maxSteps: 10,
      onChunk: (chunk) => {
        if (chunk.chunk.type === "text-delta" && chunk.chunk.textDelta) {
          // console.log("DEBUG: Backend emitted text-delta", chunk.chunk.textDelta.length);
        }
      },
      // experimental_transform: smoothStream({
      //   chunking: "word",
      //   delayInMs: 10,
      // }),
      temperature: modelConfig.provider === "groq" ? 0 : undefined,
      stopWhen: stepCountIs(modelConfig.provider === "groq" ? 6 : 10),
      providerOptions: {
        ...(adaptiveThinking && model.startsWith("openai/gpt-oss")
          ? { openai: { reasoningEffort: "medium" } }
          : {}),
        ...(adaptiveThinking && modelConfig.provider === "google"
          ? { google: { thinking: { type: "enabled", budgetTokens: 4000 } } }
          : {}),
        ...(modelConfig.provider === "groq"
          ? { openai: { parallelToolCalls: false } }
          : {}),
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      messageMetadata: () => ({ model, sessionId: activeSessionId }),
      sendSources: true,
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
      onError: (error) => {
        console.error(
          "Chat stream error details:",
          JSON.stringify(error, null, 2),
        );
        return formatStreamError(error);
      },
      onFinish: async ({ responseMessage, isAborted }) => {
        if (isAborted || !activeSessionId) return;

        try {
          const assistantText = getMessageText(responseMessage);
          const hasToolCalls = responseMessage.parts?.some(
            (p) => p.type.startsWith("tool-") || p.type === "tool-invocation",
          );
          const hasReasoning = responseMessage.parts?.some(
            (p) => p.type === "reasoning" && p.text?.trim(),
          );

          if (!assistantText && !hasToolCalls && !hasReasoning) {
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
            "I performed research using tools, but was unable to synthesize a final text summary. You can review the research steps and sources above for details.";

          let finalParts = [...(responseMessage.parts || [])];

          // If we have research but no final text, and NO reasoning was provided in the last turn, add fallback
          if (!assistantText && hasToolCalls && !hasReasoning) {
            console.warn(
              "Synthesis failed for session:",
              activeSessionId,
              "Model:",
              model,
            );
            finalParts.push({ type: "text", text: fallbackText });
          }

          const resolvedText =
            assistantText ||
            (hasReasoning ? "" : hasToolCalls ? fallbackText : "");

          await prisma.chatMessage.upsert({
            where: { id: responseId },
            update: {
              text: resolvedText,
              parts: toJsonInput(finalParts),
              metadata: toJsonInput(responseMessage.metadata),
            },
            create: {
              id: responseId,
              sessionId: activeSessionId,
              role: "assistant",
              text: resolvedText,
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
