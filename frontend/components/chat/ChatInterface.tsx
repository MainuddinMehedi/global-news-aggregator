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
  MoreVerticalIcon,
  Robot01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import ChatInput from "./ChatInput";
import ContextPanel, { ContextPills } from "./ContextPanel";
import MessageList from "./MessageList";
import type { ContextItem } from "./types";
import VoiceSession from "./VoiceSession";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const MODELS = [
  { id: "groq/compound", label: "Compound (Web Search)", icon: "🔍" },
  { id: "groq/compound-mini", label: "Compound Mini", icon: "⚡" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", icon: "⚖️" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", icon: "📄" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", icon: "⚡" },
];

export default function ChatInterface() {
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { contexts },
    }),
    messages: [
      {
        id: "init-1",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Hello! I am your AI geopolitical analyst. How can I help you today?",
          },
        ],
      } as UIMessage,
    ],
    onError: (err) => {
      console.error("Chat error:", err);
      toast.error(err.message || "Failed to get response. Please try again.");
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll is now handled in MessageList

  // ---------------------------------------------------------------------------
  // Message handling
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(
        { role: "user", parts: [{ type: "text", text }] },
        { body: { model: selectedModel } },
      );
    },
    [sendMessage, selectedModel],
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
      return [...prev, draft];
    });
  }, []);

  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden min-h-0">
      {/* ── Main chat column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">
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

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>
            <button
              aria-label="More options"
              className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
            >
              <HugeiconsIcon icon={MoreVerticalIcon} className="w-5 h-5" />
            </button>
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
