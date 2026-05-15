import type { UIMessage } from "ai";

export const INITIAL_ASSISTANT_MESSAGE: UIMessage = {
  id: "init-1",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hello! I am your AI geopolitical analyst. How can I help you today?",
    },
  ],
};

export function getMessageText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("\n")
      .trim();
  }
  if (typeof message.content === "string") {
    return message.content.trim();
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
