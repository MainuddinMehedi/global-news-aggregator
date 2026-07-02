import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  smoothStream,
  wrapLanguageModel,
  extractReasoningMiddleware,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { auth } from "@/auth";
import { Prisma } from "../../../../shared/prisma-client";
import prisma from "@/lib/prisma";
import { normalizeContextForDb } from "@/lib/chat/contexts";
import { createSessionTitle, getMessageText } from "@/lib/chat/messages";
import type { ContextItem } from "@/types/chat";
import { getModel } from "@/lib/ai/modelRegistry";
import { createProviderClient } from "@/lib/ai/providers";
import {
  webSearchTool,
  fetchUrlTool,
  searchArticlesTool,
} from "@/lib/ai/tools";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are an AI news analyst embedded in a global news aggregator. 
Your job is to help users understand, synthesize, and question the news.

The platform indexes news across 10 categories:
  - geopolitics, economy, business, technology, environment
  - security, politics, society, bangladesh, sports

Every article is enriched with bias labels, sentiment scores, 
source origins, and multi-perspective metadata. Your role:

- Match your tone and depth to the user's query and the category. 
  A sports question gets a sports answer; a geopolitics question 
  gets strategic depth. Do not force a socio-political angle on 
  neutral or entertainment-oriented topics.

- When discussing contentious topics, surface multiple viewpoints 
  (e.g. Western vs Eastern framing, government vs independent 
  sources). Reference bias metadata when relevant.

- Cite specific events, dates, actors, and sources grounded in 
  the platform's articles.

- Write clearly: paragraphs for narrative, lists for comparisons. 
  Avoid tables except for side-by-side technical or numerical data.

CRITICAL RULES:
1. Always conclude with a synthesized text answer — never end on 
   a tool call or reasoning block.
2. SEMANTIC ROUTING (TOOL USAGE):
   - If the user asks about news, current events, or geopolitical analysis, you MUST use the \`search_articles\` tool first.
   - If they ask a general knowledge question, answer directly using your internal knowledge (do NOT use tools).
   - ONLY fallback to \`web_search\` if \`search_articles\` returns zero results for a highly recent/breaking event.
3. If the user explicitly asks to "check the db" for a topic, do NOT use 
   web search at all. Answer based purely on the DB results.
4. When asked if something exists in the DB, answer with explicit references, 
   citing the specific sources and articles found.
5. Ground analysis in the provided context items when available.
6. If a user provides an article URL or context item, analyze it 
   directly rather than searching the web for it.`;

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

function formatStreamError(error: unknown) {
  const err =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const message = typeof err.message === "string" ? err.message : "";
  const code = typeof err.code === "string" ? err.code : "";
  const statusCode =
    typeof err.statusCode === "number" ? err.statusCode : undefined;
  const constructorName = (err as any)?.constructor?.name || "";

  // Groq specific debugging for tool_use_failed
  if (code === "tool_use_failed" || message.includes("failed_generation")) {
    const failedGeneration =
      (err as any).failed_generation ||
      (err as any).responseBody?.error?.failed_generation;

    if (failedGeneration) {
      console.error("GROQ FAILED GENERATION:", failedGeneration);
    } else {
      console.error(
        "GROQ TOOL ERROR OBJECT:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
    }
  }

  // ── Known user-facing errors ──

  if (
    statusCode === 413 ||
    code === "request_too_large" ||
    message.includes("Request Entity Too Large")
  ) {
    return "This conversation is too large for this model\u2019s context window. Switch to a model with a larger context (like Llama 4 Scout or Maverick with 1M\u201310M tokens) or start a new conversation.";
  }

  if (message.includes("tool calling is not supported")) {
    return "This model uses built-in tools and doesn\u2019t support external tool definitions. Switch to a different model.";
  }

  if (code === "rate_limit_exceeded" || message.includes("tokens per minute")) {
    return "Rate limit reached for this model. Try switching to a different model or wait a moment before sending another message.";
  }

  // ── Prisma errors (never show DB internals) ──
  if (
    constructorName.startsWith("Prisma") ||
    constructorName.startsWith("PrismaClient")
  ) {
    return "Something went wrong saving the conversation. Your message was still sent.";
  }

  // ── API errors with a statusCode ──
  if (statusCode) {
    const responseBody = err.responseBody;
    if (typeof responseBody === "string") {
      try {
        const parsed = JSON.parse(responseBody);
        const apiMsg = parsed?.error?.message || parsed?.error;
        if (apiMsg && typeof apiMsg === "string") return apiMsg;
      } catch {
        // ignore parse errors, fall through to raw message
      }
    }
    return message || "The API returned an error. Please try again.";
  }

  // ── Internal/SDK errors (no statusCode) ──
  return "Something went wrong. Please try again.";
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      contexts,
      model = "ministral-8b-2512",
      adaptiveThinking = false,
      sessionId,
      responseMode = "concise",
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
      ? getMessageText(latestUserMessage as unknown as UIMessage)
      : "";

    const authSession = await auth();
    const isGuest = !authSession?.user?.id;
    const effectiveModel = isGuest ? "ministral-8b-2512" : model;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await prisma.chatSession.create({
        data: {
          title: createSessionTitle(latestUserText),
          model: effectiveModel,
          responseMode,
          userId: isGuest ? null : authSession.user.id,
        },
      });
      activeSessionId = session.id;
    } else {
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { model: effectiveModel, responseMode },
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

    if (isGuest) {
      const userMessageCount = messages.filter((m) => m.role === "user").length;

      if (userMessageCount > 10) {
        const encoder = new TextEncoder();
        const limitMessage =
          "You've reached the 10-message limit for guest sessions. We rely on limited free-tier AI APIs to keep this platform accessible, and capping unauthenticated chats helps us manage API quotas and prevent database bloat. Please sign in to continue this conversation and help us prevent abuse.";

        // Also save this rejection message to the DB so it persists on reload
        if (activeSessionId) {
          const responseId = `msg-${Date.now().toString(36)}`;
          await prisma.chatMessage.create({
            data: {
              id: responseId,
              sessionId: activeSessionId,
              role: "assistant",
              text: limitMessage,
              parts: [{ type: "text", text: limitMessage }],
            },
          });
        }

        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(`0:${JSON.stringify(limitMessage)}\n`),
            );
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "X-Vercel-AI-Data-Stream": "v1",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
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

    const modelConfig = getModel(effectiveModel);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: `Model ${effectiveModel} is not supported.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const provider = createProviderClient(modelConfig.provider);
    const aiModel = provider.chat(
      modelConfig.provider === "github"
        ? effectiveModel.slice("github:".length)
        : effectiveModel,
    );

    // DeepSeek R1 models on GitHub use <think> tags for reasoning.
    // Wrap the model with reasoning extraction middleware to handle this.
    // We only apply this to R1 (reasoning) models, not general V3 models.
    const effectiveModelInstance =
      effectiveModel.includes("deepseek") &&
      effectiveModel.toLowerCase().includes("r1")
        ? wrapLanguageModel({
            model: aiModel,
            middleware: extractReasoningMiddleware({ tagName: "think" }),
          })
        : aiModel;

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
        // Keep assistant messages that have tool calls even if text is empty
        const hasToolCalls = msg.parts?.some(
          (p) => p.type === "tool-invocation" || p.type.startsWith("tool-"),
        );
        if (
          msg.role === "assistant" &&
          !getMessageText(msg as unknown as UIMessage).trim() &&
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
      ? {
          web_search: webSearchTool,
          fetch_url: fetchUrlTool,
          search_articles: searchArticlesTool,
        }
      : undefined;

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const result = streamText({
      model: effectiveModelInstance,
      system: `${systemPrompt}\n\nCurrent Date: ${today}`,
      messages: coreMessages,
      tools,
      // @ts-ignore - maxSteps is supported in modern AI SDK but type check may fail due to specific version mismatch
      maxSteps: 10,
      maxTokens: adaptiveThinking ? 16384 : 4096,
      experimental_transform: [
        smoothStream({
          chunking: "word",
          delayInMs: 20,
        }),
      ],
      temperature: modelConfig.provider === "groq" ? 0 : undefined,
      stopWhen: stepCountIs(modelConfig.provider === "groq" ? 6 : 10),
      providerOptions: {
        ...(adaptiveThinking && effectiveModel.startsWith("openai/gpt-oss")
          ? {
              openai: {
                reasoningEffort: responseMode === "concise" ? "low" : "medium",
              },
            }
          : {}),
        ...(adaptiveThinking && modelConfig.provider === "google"
          ? {
              google: {
                thinking: {
                  type: "enabled",
                  budgetTokens: responseMode === "concise" ? 2000 : 4000,
                },
              },
            }
          : {}),
        ...(modelConfig.provider === "groq"
          ? { openai: { parallelToolCalls: false } }
          : {}),
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      messageMetadata: () => ({
        model: effectiveModel,
        sessionId: activeSessionId,
      }),
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
              model: effectiveModel,
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
              effectiveModel,
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
              model: effectiveModel,
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
