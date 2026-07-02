"use client";

import type { ChatSessionListItem } from "@/components/chat/layout/ChatHistoryPanel";
import { getDefaultModel } from "@/lib/ai/modelRegistry";
import type { ContextItem } from "@/types/chat";
import type { UIMessage } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ChatSessionPayload = {
  id: string;
  title: string;
  model: string;
  responseMode: "concise" | "descriptive";
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: UIMessage[];
  contexts?: ContextItem[];
};

interface UseChatSessionsProps {
  setMessages: (messages: UIMessage[]) => void;
  setContexts: (contexts: ContextItem[]) => void;
  setSelectedModel: (model: string) => void;
  isGuest: boolean;
}

export function useChatSessions({
  setMessages,
  setContexts,
  setSelectedModel,
  isGuest,
}: UseChatSessionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Single Source of Truth
  const activeSessionId = searchParams.get("session") ?? undefined;

  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/chat/sessions");
      if (!res.ok) throw new Error("Failed to load chat sessions");

      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load chat history");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const selectSession = useCallback(
    (id: string) => {
      router.replace(`/chat?session=${id}`, { scroll: false });
    },
    [router],
  );

  const handleNewChat = useCallback(() => {
    router.replace("/chat", { scroll: false });
  }, [router]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/chat/sessions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete chat");

        setSessions((prev) => prev.filter((session) => session.id !== id));

        if (id === activeSessionId) {
          router.replace("/chat", { scroll: false });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete chat");
      }
    },
    [activeSessionId, router],
  );

  // Derived loading state of the active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setContexts([]);
      setSelectedModel(getDefaultModel(isGuest));
      return;
    }

    let isMounted = true;
    async function loadActiveSession(id: string) {
      try {
        const res = await fetch(`/api/chat/sessions/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Chat not found. Starting a new chat.");
            if (isMounted) {
              router.replace("/chat", { scroll: false });
            }
            return;
          }
          throw new Error("Failed to load chat");
        }
        const data = await res.json();
        const session = data.session as ChatSessionPayload;

        if (isMounted) {
          setSelectedModel(session.model || getDefaultModel(isGuest));
          setContexts(session.contexts ?? []);
          setMessages(
            session.messages && session.messages.length > 0
              ? session.messages
              : [],
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to open chat");
      }
    }

    loadActiveSession(activeSessionId);

    return () => {
      isMounted = false;
    };
  }, [
    activeSessionId,
    router,
    setContexts,
    setMessages,
    setSelectedModel,
    isGuest,
  ]);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  return {
    activeSessionId,
    sessions,
    setSessions,
    sessionsLoading,
    loadSessions,
    selectSession,
    handleNewChat,
    handleDeleteSession,
  };
}
