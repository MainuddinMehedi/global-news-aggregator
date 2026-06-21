"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  MessageSquare,
  File01Icon,
  ArrowDown01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useIsChatOpen,
  useCloseChat,
  useChatContextArticle,
  useClearChatContext,
} from "@/store";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import ContextPickerModal from "./ContextPickerModal";
import { MODEL_REGISTRY, getActiveModels } from "@/lib/ai/modelRegistry";
import { contextFromArticle } from "@/lib/chat/contexts";
import { useChatContext } from "@/hooks/useChatContext";
import { useChatFlow } from "@/hooks/useChatFlow";
import { WelcomeScreen } from "./WelcomeScreen";

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
    <div className="mx-3 mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex shrink-0 items-center justify-center mt-0.5">
          <HugeiconsIcon icon={File01Icon} className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate leading-snug">
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{source}</p>
        </div>
        <button
          onClick={onClear}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 cursor-pointer"
          aria-label="Remove context"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-primary/70 mt-1.5 pl-8">
        AI will analyze this article in context
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FloatingChat component — floating panel, Reddit-style
// ---------------------------------------------------------------------------

export default function FloatingChat() {
  const isOpen = useIsChatOpen();
  const closeChat = useCloseChat();
  const contextArticle = useChatContextArticle();
  const clearContext = useClearChatContext();

  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedModel, setSelectedModel] = useState(MODEL_REGISTRY[0].id);
  const [adaptiveThinking, setAdaptiveThinking] = useState(false);
  const [responseMode, setResponseMode] = useState<"concise" | "descriptive">(
    "concise",
  );

  const preparedArticleIdRef = useRef<string | null>(null);

  const {
    contexts,
    setContexts,
    contextPickerOpen,
    setContextPickerOpen,
    handleAddContexts,
  } = useChatContext(sessionId);

  const {
    messages,
    status,
    setMessages,
    handleSend,
  } = useChatFlow({
    sessionId,
    onSessionCreated: setSessionId,
    contexts,
    selectedModel,
    adaptiveThinking,
    responseMode,
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleNewChat = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
    setSelectedModel(MODEL_REGISTRY[0].id);
    preparedArticleIdRef.current = null;
    if (contextArticle) {
      setContexts([contextFromArticle(contextArticle)]);
    } else {
      setContexts([]);
    }
  }, [contextArticle, setMessages, setContexts]);

  const handleClearContext = useCallback(() => {
    preparedArticleIdRef.current = null;
    setContexts([]);
    clearContext();
  }, [clearContext, setContexts]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, closeChat]);

  // Mount/context update effect
  useEffect(() => {
    if (!isOpen || !contextArticle) return;
    if (preparedArticleIdRef.current === contextArticle.id) return;
    preparedArticleIdRef.current = contextArticle.id;

    const articleContext = contextFromArticle(contextArticle);
    setContexts([articleContext]);
    setMessages([]);
    setSessionId(undefined);
    setSelectedModel(MODEL_REGISTRY[0].id);
  }, [contextArticle, isOpen, setMessages, setContexts]);

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
          // Mobile: near-fullscreen inset
          "inset-x-3 top-20 bottom-3 w-auto h-auto",
          // sm and up: floating bottom-right
          "sm:inset-x-auto sm:top-auto sm:bottom-2 sm:right-6 sm:w-[480px] sm:h-[540px]",
          // lg
          "lg:w-[560px] lg:h-[600px]",
          // 2xl
          "2xl:w-[640px] 2xl:h-[680px]",
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
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Minimize chat"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={closeChat}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
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
          {messages.length === 0 ? (
            <WelcomeScreen
              onNewChat={handleNewChat}
              onSend={handleSend}
              compact={true}
            />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}
        </div>

        {/* ── Input ───────────────────────────────────────────────────── */}
        <div className="pb-2">
          <ChatInput
            onSend={handleSend}
            onVoiceToggle={() => {}}
            isVoiceMode={false}
            onAddContext={() => setContextPickerOpen(true)}
            models={getActiveModels()}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            responseMode={responseMode}
            onResponseModeChange={setResponseMode}
            adaptiveThinking={adaptiveThinking}
            onAdaptiveThinkingChange={setAdaptiveThinking}
            disabled={isLoading}
          />
        </div>
      </div>

      <ContextPickerModal
        isOpen={contextPickerOpen}
        onClose={() => setContextPickerOpen(false)}
        onAdd={handleAddContexts}
        existingItems={contexts}
      />
    </>
  );
}
