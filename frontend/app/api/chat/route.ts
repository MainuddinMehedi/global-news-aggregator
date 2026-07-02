import {
  streamText,
  stepCountIs,
  smoothStream,
  wrapLanguageModel,
  extractReasoningMiddleware,
  type UIMessage,
} from "ai";
import { auth } from "@/auth";
import {
  createSessionTitle,
  getMessageText,
  prepareCoreMessages,
  estimateRequestSize,
} from "@/lib/chat/messages";
import type { ContextItem } from "@/types/chat";
import { getModel, DEFAULT_USER_MODEL, DEFAULT_GUEST_MODEL, GUEST_ALLOWED_MODELS } from "@/lib/ai/modelRegistry";
import { createProviderClient } from "@/lib/ai/providers";
import {
  webSearchTool,
  fetchUrlTool,
  searchArticlesTool,
} from "@/lib/ai/tools";
import {
  createChatSession,
  updateChatSession,
  upsertChatMessage,
  saveChatContexts,
} from "@/lib/chat/db";
import { buildChatSystemPrompt } from "@/lib/chat/prompts";
import { formatStreamError } from "@/lib/chat/errors";
import { checkAndHandleGuestLimits } from "@/lib/chat/guestLimits";
import { buildProviderOptions } from "@/lib/chat/providers";
import { handleStreamFinish } from "@/lib/chat/streamHandlers";

export const maxDuration = 120;

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

export async function POST(req: Request) {
  try {
    const {
      messages,
      contexts,
      model = DEFAULT_USER_MODEL,
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
    let effectiveModel = model;
    if (isGuest && !GUEST_ALLOWED_MODELS.includes(model)) {
      effectiveModel = DEFAULT_GUEST_MODEL;
    }

    // 1. Session Setup
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await createChatSession({
        title: createSessionTitle(latestUserText),
        model: effectiveModel,
        responseMode,
        userId: isGuest ? null : authSession.user.id,
      });

      activeSessionId = session.id;
    } else {
      await updateChatSession(activeSessionId, {
        model: effectiveModel,
        responseMode,
      });
    }

    if (contexts?.length) {
      await saveChatContexts(activeSessionId, contexts as ContextItem[]);
    }

    if (latestUserMessage && activeSessionId) {
      const userMessageId =
        latestUserMessage.id || `user-${Date.now().toString(36)}`;

      await upsertChatMessage({
        id: userMessageId,
        sessionId: activeSessionId,
        role: "user",
        text: latestUserText,
        parts: latestUserMessage.parts || [
          { type: "text", text: latestUserText },
        ],
        metadata: latestUserMessage.metadata,
      });
    }

    // 2. Guest Limits
    const guestLimitResponse = await checkAndHandleGuestLimits({
      isGuest,
      messages: messages as any,
      activeSessionId,
    });
    if (guestLimitResponse) return guestLimitResponse;

    // 3. System Prompt & Model Config
    const todayDateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = buildChatSystemPrompt({
      responseMode,
      contexts: contexts as any,
      todayDateStr,
    });

    const modelConfig = getModel(effectiveModel);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: `Model ${effectiveModel} is not supported.` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. Initialize Provider Client
    const provider = createProviderClient(modelConfig.provider);
    const aiModel = provider.chat(
      modelConfig.provider === "github"
        ? effectiveModel.slice("github:".length)
        : effectiveModel,
    );

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
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Message Preparation
    const MAX_TURNS =
      modelConfig.provider === "groq"
        ? 4
        : modelConfig.contextWindow > 32000
          ? 16
          : 8;
    const coreMessages = await prepareCoreMessages(messages as any, MAX_TURNS);
    const requestSize = estimateRequestSize(systemPrompt, coreMessages as any);

    console.log("DEBUG: Sending to streamText", {
      model,
      msgCount: coreMessages.length,
      requestSize,
      adaptiveThinking,
    });

    // 6. Tools & Provider Options
    const tools = modelConfig.capabilities.supportsTools
      ? {
          web_search: webSearchTool,
          fetch_url: fetchUrlTool,
          search_articles: searchArticlesTool,
        }
      : undefined;

    const providerOptions = buildProviderOptions({
      adaptiveThinking,
      effectiveModel,
      modelProvider: modelConfig.provider,
      responseMode,
    });

    // 7. Execute AI Stream
    const result = streamText({
      model: effectiveModelInstance,
      system: systemPrompt,
      messages: coreMessages,
      tools,
      // @ts-ignore
      maxSteps: 10,
      maxTokens: adaptiveThinking ? 16384 : 4096,
      experimental_transform: [
        smoothStream({ chunking: "word", delayInMs: 20 }),
      ],
      temperature: modelConfig.provider === "groq" ? 0 : undefined,
      stopWhen: stepCountIs(modelConfig.provider === "groq" ? 6 : 10),
      providerOptions,
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
        await handleStreamFinish({
          responseMessage: responseMessage as unknown as UIMessage,
          isAborted,
          activeSessionId,
          effectiveModel,
          responseMode,
          latestUserText,
        });
      },
    });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    const message = formatStreamError(error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
