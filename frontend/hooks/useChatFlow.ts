"use client";

import { normalizeError } from "@/lib/chat/errors";
import { createSessionTitle } from "@/lib/chat/messages";
import type { ContextItem } from "@/types/chat";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseChatFlowProps {
  sessionId?: string;
  onSessionCreated?: (
    id: string,
    session?: {
      id: string;
      title: string;
      model: string;
      responseMode: string;
      createdAt: string;
      updatedAt: string;
    },
  ) => void;
  contexts: ContextItem[];
  selectedModel: string;
  responseMode: "concise" | "descriptive";
  adaptiveThinking?: boolean;
}

export function useChatFlow({
  sessionId: propSessionId,
  onSessionCreated,
  contexts,
  selectedModel,
  responseMode,
  adaptiveThinking,
}: UseChatFlowProps) {
  const sendingRef = useRef(false);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    onError: (err) => {
      console.error("Chat error:", err);

      const errorMessage = normalizeError(err);
      const errorParts = [
        {
          type: "text",
          text: errorMessage,
        },
      ] as UIMessage["parts"];

      setMessages((prev) => {
        const lastAssistantIndex = [...prev]
          .reverse()
          .findIndex((msg) => msg.role === "assistant");

        if (lastAssistantIndex === -1) {
          return [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              parts: errorParts,
              metadata: { error: true },
            } as UIMessage,
          ];
        }

        const index = prev.length - 1 - lastAssistantIndex;
        const updated = [...prev];

        updated[index] = {
          ...updated[index],
          parts: errorParts,
          metadata: {
            ...(updated[index].metadata as Record<string, unknown> | undefined),
            error: true,
          },
        };

        return updated;
      });

      toast.error(errorMessage);
    },
  });

  const createSession = useCallback(
    async (title: string, initialContexts = contexts) => {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          model: selectedModel,
          responseMode,
          contexts: initialContexts,
        }),
      });

      if (!res.ok) throw new Error("Failed to create chat");

      const data = await res.json();
      const id = data.session.id as string;

      if (onSessionCreated) {
        onSessionCreated(id, data.session);
      }
      return id;
    },
    [contexts, selectedModel, responseMode, onSessionCreated],
  );

  const ensureSession = useCallback(
    async (firstMessage: string, initialContexts = contexts) => {
      if (propSessionId) return propSessionId;

      const title = createSessionTitle(firstMessage);
      return await createSession(title, initialContexts);
    },
    [propSessionId, createSession, contexts],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || sendingRef.current) return;

      sendingRef.current = true;
      try {
        const targetSessionId = await ensureSession(text);

        sendMessage(
          { role: "user", parts: [{ type: "text", text }] },
          {
            body: {
              model: selectedModel,
              sessionId: targetSessionId,
              responseMode,
              contexts,
              adaptiveThinking,
            },
          },
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to send message");
      } finally {
        sendingRef.current = false;
      }
    },
    [contexts, ensureSession, responseMode, selectedModel, sendMessage],
  );

  return {
    messages,
    sendMessage,
    status,
    setMessages,
    stop,
    createSession,
    ensureSession,
    handleSend,
  };
}
