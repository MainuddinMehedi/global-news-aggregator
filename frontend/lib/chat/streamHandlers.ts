import { updateChatSession, upsertChatMessage } from "@/lib/chat/db";
import { createSessionTitle, getMessageText } from "@/lib/chat/messages";
import type { UIMessage } from "ai";

export async function handleStreamFinish({
  responseMessage,
  isAborted,
  activeSessionId,
  effectiveModel,
  responseMode,
  latestUserText,
}: {
  responseMessage: UIMessage;
  isAborted: boolean;
  activeSessionId?: string;
  effectiveModel: string;
  responseMode: "concise" | "descriptive";
  latestUserText: string;
}) {
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

    const responseId = responseMessage.id || `msg-${Date.now().toString(36)}`;

    const fallbackText =
      "I performed research using tools, but was unable to synthesize a final text summary. You can review the research steps and sources above for details.";

    const finalParts = [...(responseMessage.parts || [])];

    if (!assistantText && hasToolCalls && !hasReasoning) {
      finalParts.push({ type: "text", text: fallbackText });
    }

    const resolvedText =
      assistantText || (hasReasoning ? "" : hasToolCalls ? fallbackText : "");

    await upsertChatMessage({
      id: responseId,
      sessionId: activeSessionId,
      role: "assistant",
      text: resolvedText,
      parts: finalParts,
      metadata: responseMessage.metadata,
    });

    await updateChatSession(activeSessionId, {
      model: effectiveModel,
      responseMode,
      title: latestUserText ? createSessionTitle(latestUserText) : undefined,
    });
  } catch (err) {
    console.error("Error in onFinish background task:", err);
  }
}
