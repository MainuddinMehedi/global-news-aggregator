import type { UIMessage } from "ai";

export const INITIAL_ASSISTANT_MESSAGE: UIMessage = {
  id: "init-1",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "I am your AI geopolitical analyst. Grounded in live news and multi-perspective data, I can help you analyze global trends or specific events. How can I help you today?",
    },
  ],
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getMessageText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => {
        if (part.type === "text") return part.text || "";
        // If it's a reasoning part, we might want to include it IF it's the only thing there
        // but for synthesis we really want the text part.
        return "";
      })
      .join("\n")
      .trim();
  }
  if (typeof message.content === "string") {
    return message.content.trim();
  }
  // AI SDK Core Message content can be an array of parts
  if (Array.isArray(message.content)) {
    return message.content
      .map((part: any) => (part.type === "text" ? part.text || "" : ""))
      .join("\n")
      .trim();
  }
  return "";
}

export function createSessionTitle(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "New Chat";
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

export function isInitialAssistantMessage(message: UIMessage) {
  return message.id === INITIAL_ASSISTANT_MESSAGE.id;
}
