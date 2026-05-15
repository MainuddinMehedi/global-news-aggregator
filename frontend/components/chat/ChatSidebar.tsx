"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PlusSignIcon,
  MessageSquare,
  Robot01Icon,
  Sparkles,
  File01Icon,
  ArrowDown01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import {
  useIsChatOpen,
  useCloseChat,
  useChatContextArticle,
  useClearChatContext,
} from "@/store";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import { CHAT_MODELS } from "./models";
import type { ContextItem } from "./types";
import { contextFromArticle } from "@/lib/chat/contexts";
import {
  INITIAL_ASSISTANT_MESSAGE,
  createSessionTitle,
} from "@/lib/chat/messages";

// ---------------------------------------------------------------------------
// Context banner — shown when opened from an article card
// ---------------------------------------------------------------------------

function ContextBanner({
  title,
  source,
  onClear,
}: {
  title: string;
  source: string;
  onClear: () => void;
}) {
  return (
    <div className="mx-3 mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex shrink-0 items-center justify-center mt-0.5">
          <HugeiconsIcon icon={File01Icon} className="w-3 h-3 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate leading-snug">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{source}</p>
        </div>
        <button
          onClick={onClear}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          aria-label="Remove context"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[10px] text-primary/70 mt-1.5 pl-8">
        AI will analyze this article in context
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen — shown when no conversation is active
// ---------------------------------------------------------------------------

function WelcomeScreen({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center select-none">
      {/* Glowing orb illustration */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <HugeiconsIcon icon={Robot01Icon} className="w-8 h-8 text-primary" />
        </div>
        {/* Subtle glow rings */}
        <div className="absolute inset-0 -m-2 rounded-full bg-primary/5 animate-pulse" />
        <div className="absolute inset-0 -m-4 rounded-full bg-primary/[0.02]" />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">
        Welcome to AI Chat
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
        Ask questions about geopolitical events, get multi-perspective analysis,
        or explore trends.
      </p>

      {/* Quick action chips */}
      <div className="flex flex-col gap-1.5 mt-5 w-full max-w-[240px]">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-foreground hover:bg-muted/50 hover:border-primary/30 transition-all group"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform"
          />
          <span className="font-medium">Start new chat</span>
        </button>

        <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground transition-all group">
          <HugeiconsIcon
            icon={Sparkles}
            className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors"
          />
          <span>Summarize today&apos;s news</span>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatSidebar component — floating panel, Reddit-style
// ---------------------------------------------------------------------------

export default function ChatSidebar() {
  const isOpen = useIsChatOpen();
  const closeChat = useCloseChat();
  const contextArticle = useChatContextArticle();
  const clearContext = useClearChatContext();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0].id);
  const [adaptiveThinking, setAdaptiveThinking] = useState(false);
  const preparedArticleIdRef = useRef<string | null>(null);
  const responseMode = "concise";

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { contexts, sessionId, responseMode },
    }),
    messages: [INITIAL_ASSISTANT_MESSAGE],
    onError: (error) => {
      console.error("Sidebar chat error:", error);
      toast.error("Failed to get chat response");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const visibleMessages = messages.filter(
    (message) => message.id !== INITIAL_ASSISTANT_MESSAGE.id,
  );

  const createSession = useCallback(
    async (title: string, initialContexts: ContextItem[] = []) => {
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
      if (!res.ok) throw new Error("Failed to create chat session");
      const data = await res.json();
      const id = data.session.id as string;
      setSessionId(id);
      return id;
    },
    [responseMode, selectedModel],
  );

  const handleNewChat = useCallback(() => {
    setSessionId(undefined);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    preparedArticleIdRef.current = null;
    if (contextArticle) {
      setContexts([contextFromArticle(contextArticle)]);
    } else {
      setContexts([]);
    }
  }, [contextArticle, setMessages]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        const targetSessionId =
          sessionId ||
          (await createSession(createSessionTitle(text), contexts));
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
      createSession,
      responseMode,
      selectedModel,
      sendMessage,
      sessionId,
    ],
  );

  const handleClearContext = useCallback(() => {
    preparedArticleIdRef.current = null;
    setContexts([]);
    clearContext();
  }, [clearContext]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeChat]);

  useEffect(() => {
    if (!isOpen || !contextArticle) return;
    if (preparedArticleIdRef.current === contextArticle.id) return;
    preparedArticleIdRef.current = contextArticle.id;

    const articleContext = contextFromArticle(contextArticle);
    setContexts([articleContext]);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setSessionId(undefined);

    createSession(`Chat: ${contextArticle.title}`, [articleContext]).catch(
      (error) => {
        console.error(error);
        toast.error("Failed to prepare article chat");
      },
    );
  }, [contextArticle, createSession, isOpen, setMessages]);

  useEffect(() => {
    if (!contextArticle) {
      preparedArticleIdRef.current = null;
    }
  }, [contextArticle]);

  return (
    <>
      {/* Backdrop — subtle, click to dismiss */}
      <div
        onClick={closeChat}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40",
          "transition-opacity duration-200 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Floating chat panel */}
      <div
        role="dialog"
        aria-label="AI Chat"
        className={cn(
          // Positioning — floating bottom-right like Reddit
          "fixed z-50",
          "bottom-2 right-6",
          // Dimensions — compact floating panel
          "w-[480px] h-[540px]",
          // Surface
          "bg-background rounded-2xl",
          "border border-border",
          "flex flex-col overflow-hidden",
          // Shadow — elevated floating card
          "shadow-2xl shadow-black/25",
          // Animation — scale + fade from bottom-right origin
          "transition-all duration-250 ease-out",
          "origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <HugeiconsIcon
                icon={MessageSquare}
                className="w-3.5 h-3.5 text-primary"
              />
            </div>
            <h2 className="font-semibold text-sm text-foreground">Chats</h2>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Open full chat page */}
            <Link
              href={sessionId ? `/chat?session=${sessionId}` : "/chat"}
              onClick={closeChat}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Open full chat"
            >
              <HugeiconsIcon icon={LinkSquare01Icon} className="w-4 h-4" />
            </Link>

            {/* Minimize */}
            <button
              onClick={closeChat}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Minimize chat"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={closeChat}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Close chat"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Context banner (when opened from article) ────────────── */}
        {contextArticle && (
          <ContextBanner
            title={contextArticle.title}
            source={contextArticle.source}
            onClear={handleClearContext}
          />
        )}

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {visibleMessages.length === 0 ? (
            <WelcomeScreen onNewChat={handleNewChat} />
          ) : (
            <MessageList messages={visibleMessages} isLoading={isLoading} />
          )}
        </div>

        {/* ── Input ───────────────────────────────────────────────────── */}
        <div className="border-t border-border pb-2">
          <ChatInput
            onSend={handleSend}
            onVoiceToggle={() => {}}
            isVoiceMode={false}
            onAddContext={() => {
              if (!contextArticle) {
                toast.info("Context picker is coming next.");
              }
            }}
            models={CHAT_MODELS}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            responseMode="descriptive"
            onResponseModeChange={() => {}}
            adaptiveThinking={adaptiveThinking}
            onAdaptiveThinkingChange={setAdaptiveThinking}
            disabled={isLoading}
          />
        </div>
      </div>
    </>
  );
}
