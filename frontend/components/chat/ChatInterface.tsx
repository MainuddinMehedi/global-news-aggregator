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

import { useState, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Robot01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";

import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import VoiceSession from "./VoiceSession";
import ContextPanel, { ContextPills } from "./ContextPanel";
import type { Message, ContextItem } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init-1",
    role: "assistant",
    content:
      "Hello! I am your AI geopolitical analyst. How can I help you today?",
    createdAt: new Date().toISOString(),
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Auto-scroll to the anchor element whenever messages change
  useEffect(() => {
    document
      .getElementById("chat-scroll-anchor")
      ?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Message handling
  // ---------------------------------------------------------------------------

  const appendMessage = useCallback(
    (msg: Omit<Message, "id" | "createdAt">) => {
      setMessages((prev) => [
        ...prev,
        { ...msg, id: uid(), createdAt: new Date().toISOString() },
      ]);
    },
    [],
  );

  const handleSend = useCallback(
    (text: string) => {
      appendMessage({ role: "user", content: text });

      // TODO: Replace with real streaming API call.
      // The signature to implement:
      //   const stream = await fetchChatStream({ messages, contexts, text })
      //   for await (const chunk of stream) appendMessage(...)
      setTimeout(() => {
        appendMessage({
          role: "assistant",
          content:
            "The AI backend is not yet connected — replace this stub in ChatInterface.handleSend.",
        });
      }, 800);
    },
    [appendMessage],
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
      appendMessage({ role: "assistant", content: text });
    },
    [appendMessage],
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
      return [...prev, draft];
    });
  }, []);

  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Main chat column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0 bg-background/80 backdrop-blur-md z-10">
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

          <button
            aria-label="More options"
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
          </button>
        </div>

        {/* Message list + voice overlay share the same flex-1 area */}
        <div className="flex-1 overflow-hidden relative">
          <MessageList messages={messages} />

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
          contextPillsSlot={
            <ContextPills
              items={contexts}
              onRemove={removeContext}
              className="lg:hidden"
            />
          }
        />
      </div>

      {/* ── Context panel (desktop) ──────────────────────────────────────── */}
      <ContextPanel
        items={contexts}
        onRemove={removeContext}
        onAdd={addContext}
      />
    </div>
  );
}
