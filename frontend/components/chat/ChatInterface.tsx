"use client";

/**
 * ChatInterface — orchestrator for the /chat page.
 *
 * Responsibilities:
 *   - Own the shared state: message list, context items, voice-mode toggle
 *   - Provide the (currently stubbed) send + AI response logic
 *   - Wire child components via callbacks / slot props
 *
 * What it does NOT do:
 *   - Render any UI directly (delegates to sub-components)
 *   - Contain any voice session logic (→ VoiceSession)
 *   - Contain any input logic (→ ChatInput)
 *   - Contain any context UI (→ ContextPanel / ContextPills)
 */

import {
  ArrowRight01Icon,
  Time02Icon,
  MoreVerticalIcon,
  Robot01Icon,
  Edit02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ChatHistoryPanel, { type ChatSessionListItem } from "./ChatHistoryPanel";
import ChatInput from "./ChatInput";
import ContextPanel, { ContextPills } from "./ContextPanel";
import MessageList from "./MessageList";
import { CHAT_MODELS } from "./models";
import type { ContextItem } from "./types";
import VoiceSession from "./VoiceSession";
import {
  INITIAL_ASSISTANT_MESSAGE,
  createSessionTitle,
} from "@/lib/chat/messages";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

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

export default function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0].id);
  const [adaptiveThinking, setAdaptiveThinking] = useState(false);
  const [responseMode] = useState<"concise" | "descriptive">("descriptive");
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);

  const normalizeError = (err: unknown) => {
    if (typeof err === "string") {
      return err;
    }

    let errorMessage = "Failed to get response. Please try again.";

    if (err && typeof err === "object") {
      const errObj = err as Record<string, unknown>;

      if (typeof errObj.message === "string") {
        try {
          const parsed = JSON.parse(errObj.message);
          if (parsed && typeof parsed === "object" && "message" in parsed) {
            errorMessage = String((parsed as Record<string, unknown>).message);
          } else {
            errorMessage = errObj.message;
          }
        } catch {
          errorMessage = errObj.message;
        }
      } else if (typeof errObj.error === "string") {
        errorMessage = errObj.error;
      }

      if (
        errObj.type === "invalid_request_error" ||
        errObj.code === "request_too_large"
      ) {
        if (
          errorMessage.includes("Request Entity Too Large") ||
          errorMessage.includes("request_too_large")
        ) {
          return "Request too large: The conversation context has grown too big. Try asking a shorter question or starting a new conversation.";
        }
        return `Request error: ${errorMessage}`;
      }
    }

    return errorMessage;
  };

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { contexts, sessionId: activeSessionId, responseMode },
    }),
    messages: [INITIAL_ASSISTANT_MESSAGE],
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

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll is now handled in MessageList

  // ---------------------------------------------------------------------------
  // Session handling
  // ---------------------------------------------------------------------------

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
    async (id: string, updateUrl = true) => {
      try {
        const res = await fetch(`/api/chat/sessions/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Chat not found. Starting a new chat.");
            setActiveSessionId(undefined);
            setContexts([]);
            setMessages([INITIAL_ASSISTANT_MESSAGE]);
            router.replace("/chat", { scroll: false });
            return;
          }
          throw new Error("Failed to load chat");
        }
        const data = await res.json();
        const session = data.session as ChatSessionPayload;

        setActiveSessionId(session.id);
        setSelectedModel(session.model || CHAT_MODELS[0].id);
        setContexts(session.contexts ?? []);
        setMessages(
          session.messages && session.messages.length > 0
            ? session.messages
            : [INITIAL_ASSISTANT_MESSAGE],
        );

        if (updateUrl) {
          router.replace(`/chat?session=${session.id}`, { scroll: false });
        }
        setHistoryOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to open chat");
      }
    },
    [router, setMessages],
  );

  const createSession = useCallback(
    async (title = "New Chat", initialContexts = contexts) => {
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
      const session = data.session as ChatSessionListItem;
      setSessions((prev) => [
        session,
        ...prev.filter((s) => s.id !== session.id),
      ]);
      return session.id;
    },
    [contexts, responseMode, selectedModel],
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(undefined);
    setContexts([]);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    router.replace("/chat", { scroll: false });
    setHistoryOpen(false);
  }, [router, setMessages]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/chat/sessions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete chat");
        setSessions((prev) => prev.filter((session) => session.id !== id));
        if (id === activeSessionId) {
          setActiveSessionId(undefined);
          setContexts([]);
          setMessages([INITIAL_ASSISTANT_MESSAGE]);
          router.replace("/chat", { scroll: false });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete chat");
      }
    },
    [activeSessionId, router, setMessages],
  );

  const ensureSession = useCallback(
    async (firstMessage: string) => {
      if (activeSessionId) return activeSessionId;

      const title = createSessionTitle(firstMessage);
      const id = await createSession(title);
      setActiveSessionId(id);
      router.replace(`/chat?session=${id}`, { scroll: false });
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, title } : session,
        ),
      );
      return id;
    },
    [activeSessionId, createSession, router],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const id = searchParams.get("session");
    if (id && id !== activeSessionId) {
      // If we are currently deleting this session, the URL will update momentarily,
      // but React might fire this effect first. Check if it exists in the active sessions list (if loaded).
      // Or, if selectSession fails, it will now handle its own fallback.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      selectSession(id, false);
    } else if (!id && activeSessionId) {
      // If the URL has no session, but we have an active session, it means we navigated away (e.g. deleted it).
      // We should clear the active session state.
      setActiveSessionId(undefined);
      setContexts([]);
      setMessages([INITIAL_ASSISTANT_MESSAGE]);
    }
  }, [activeSessionId, searchParams, selectSession]);

  // ---------------------------------------------------------------------------
  // Message handling
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    async (text: string) => {
      try {
        const targetSessionId = await ensureSession(text);
        sendMessage(
          { role: "user", parts: [{ type: "text", text }] },
          {
            body: {
              model: selectedModel,
              adaptiveThinking,
              sessionId: targetSessionId,
              responseMode,
              contexts,
            },
          },
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to send message");
      }
    },
    [
      adaptiveThinking,
      contexts,
      ensureSession,
      responseMode,
      selectedModel,
      sendMessage,
    ],
  );

  // ---------------------------------------------------------------------------
  // Voice session callbacks
  // ---------------------------------------------------------------------------

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        // Treat a final transcript like a user text message.
        handleSend(text);
      }
    },
    [handleSend],
  );

  const handleVoiceAIResponse = useCallback(
    (text: string) => {
      sendMessage({ role: "assistant", parts: [{ type: "text", text }] });
    },
    [sendMessage],
  );

  const handleVoiceClose = useCallback(() => {
    setIsVoiceMode(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Context management
  // ---------------------------------------------------------------------------

  // TODO-NOTE: Manage context through zustand as you need to have the context in floating chat and chat page both.
  const addContext = useCallback(() => {
    // TODO: Open a real picker / search dialog.
    // For now, add a placeholder so the panel is explorable.
    setContexts((prev) => {
      const draft: ContextItem = {
        id: uid(),
        title: "Global Supply Chain Disruptions 2026",
        type: "article",
      };
      // Prevent duplicate title (demo guard)
      if (prev.some((c) => c.title === draft.title)) return prev;
      const next = [...prev, draft];
      if (activeSessionId) {
        fetch(`/api/chat/sessions/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contexts: [draft] }),
        }).catch((error) => {
          console.error(error);
          toast.error("Failed to save context");
        });
      }
      return next;
    });
  }, [activeSessionId]);

  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden min-h-0">
      {/* ── Main chat column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center shrink-0 bg-background/80 backdrop-blur-md z-10">
          <div className="w-full max-w-3xl mx-auto flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <HugeiconsIcon
                  icon={Robot01Icon}
                  className="w-5 h-5 text-primary"
                />
              </div>
              <div>
                <h1 className="font-semibold text-sm leading-tight">
                  AI Analyst
                </h1>
                <p className="text-xs text-muted-foreground">Always active</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeSessionId && (
                <button
                  onClick={handleNewChat}
                  aria-label="New chat"
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} className="w-5 h-5" />
                </button>
              )}

              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Chat history"
                    className={cn(
                      "hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors",
                      activeSessionId
                        ? "p-2"
                        : "flex items-center gap-2 px-3 py-1.5 text-sm font-medium",
                    )}
                  >
                    <HugeiconsIcon
                      icon={Time02Icon}
                      className={cn(
                        activeSessionId ? "w-5 h-5" : "w-4.5 h-4.5",
                      )}
                    />
                    {!activeSessionId && <span>History</span>}
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="p-0 w-full sm:max-w-md"
                  showCloseButton={false}
                >
                  <div className="sr-only">
                    <SheetTitle>Chat History</SheetTitle>
                    <SheetDescription>
                      Review your past AI chat sessions.
                    </SheetDescription>
                  </div>
                  <ChatHistoryPanel
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    loading={sessionsLoading}
                    onNewChat={handleNewChat}
                    onSelectSession={selectSession}
                    onDeleteSession={handleDeleteSession}
                  />
                </SheetContent>
              </Sheet>

              <button
                aria-label="More options"
                className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Message list + voice overlay share the same flex-1 area */}
        <div className="flex-1 overflow-hidden relative">
          <MessageList messages={messages} isLoading={isLoading} />

          {/* Voice session overlays the message area */}
          <VoiceSession
            isOpen={isVoiceMode}
            onTranscript={handleVoiceTranscript}
            onAIResponse={handleVoiceAIResponse}
            onClose={handleVoiceClose}
          />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onVoiceToggle={() => setIsVoiceMode((v) => !v)}
          isVoiceMode={isVoiceMode}
          onAddContext={addContext}
          models={CHAT_MODELS}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          adaptiveThinking={adaptiveThinking}
          onAdaptiveThinkingChange={setAdaptiveThinking}
          contextPillsSlot={
            <ContextPills
              items={contexts}
              onRemove={removeContext}
              className="lg:hidden"
            />
          }
        />
      </div>

      {/* ── Context panel toggle ────────────────────────────────────────── */}
      <button
        onClick={() => setContextPanelOpen((v) => !v)}
        className="hidden lg:flex items-center justify-center w-5 h-10 my-auto shrink-0 z-10 rounded-l-md border border-border/60 bg-background hover:bg-accent transition-colors shadow-sm"
        aria-label={
          contextPanelOpen ? "Close context panel" : "Open context panel"
        }
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            contextPanelOpen && "rotate-180",
          )}
        />
      </button>

      {/* ── Context panel (desktop) ──────────────────────────────────────── */}
      <ContextPanel
        items={contexts}
        onRemove={removeContext}
        onAdd={addContext}
        isOpen={contextPanelOpen}
        onToggle={() => setContextPanelOpen((v) => !v)}
      />
    </div>
  );
}
