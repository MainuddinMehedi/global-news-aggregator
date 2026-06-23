"use client";

/**
 * ChatInterface — orchestrator for the /chat page.
 *
 * Responsibilities:
 *   - Own the shared state: message list, context items, voice-mode toggle
 *   - Provide the send + AI response logic
 *   - Wire child components via callbacks / slot props
 *
 * What it does NOT do:
 *   - Render any UI directly (delegates to sub-components)
 *   - Contain any voice session logic (→ VoiceSession)
 *   - Contain any input logic (→ ChatInput)
 *   - Contain any context UI (→ ContextPanel / ContextPills)
 *   - Manage session lifecycle and routing sync (→ useChatSessions)
 */

import { useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { useSetSidebarCollapsed } from "@/store";
import ChatInput from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import ContextPanel, { ContextPills } from "./ContextPanel";
import MessageList from "./MessageList";
import { getActiveModels, MODEL_REGISTRY } from "@/lib/ai/modelRegistry";
import VoiceSession from "./VoiceSession";
import ContextPickerModal from "./ContextPickerModal";
import { useChatContext } from "@/hooks/useChatContext";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useChatFlow } from "@/hooks/useChatFlow";
import ChatHeader from "./ChatHeader";

export default function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session") ?? undefined;

  const {
    contexts,
    setContexts,
    contextPickerOpen,
    setContextPickerOpen,
    addContext,
    handleAddContexts,
    removeContext,
  } = useChatContext(activeSessionId);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_REGISTRY[0].id);
  const [adaptiveThinking, setAdaptiveThinking] = useState(false);
  const [responseMode, setResponseMode] = useState<"concise" | "descriptive">(
    "concise",
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    stop,
    handleSend,
  } = useChatFlow({
    sessionId: activeSessionId,
    onSessionCreated: (id, newSession) => {
      router.replace(`/chat?session=${id}`, { scroll: false });
      if (newSession) {
        setSessions((prev) => {
          if (prev.some((s) => s.id === id)) return prev;
          return [{ ...newSession, messageCount: 0 }, ...prev];
        });
      } else {
        loadSessions();
      }
    },
    contexts,
    selectedModel,
    adaptiveThinking,
    responseMode,
  });

  const {
    sessions,
    sessionsLoading,
    selectSession,
    handleNewChat,
    handleDeleteSession,
    loadSessions,
    setSessions,
  } = useChatSessions({
    setMessages,
    setContexts,
    setSelectedModel,
    selectedModel,
    responseMode,
    contexts,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const setSidebarCollapsed = useSetSidebarCollapsed();

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
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

  return (
    <div className="flex h-full w-full overflow-hidden min-h-0">
      {/* ── Main chat column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">
        <ChatHeader
          activeSessionId={activeSessionId}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          onNewChat={handleNewChat}
          onSelectSession={selectSession}
          onDeleteSession={handleDeleteSession}
        />

        <div className="flex-1 overflow-hidden relative pt-14">
          {messages.length === 0 ? (
            <WelcomeScreen onNewChat={handleNewChat} onSend={handleSend} />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}

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
          compact
          onSend={handleSend}
          onStop={stop}
          isLoading={isLoading}
          onVoiceToggle={() => setIsVoiceMode((v) => !v)}
          isVoiceMode={isVoiceMode}
          onAddContext={addContext}
          models={getActiveModels()}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          responseMode={responseMode}
          onResponseModeChange={setResponseMode}
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

      {/* ── Floating context panel (desktop) ──────────────────────────────── */}
      <ContextPanel
        items={contexts}
        onRemove={removeContext}
        onAdd={addContext}
      />      <ContextPickerModal
        isOpen={contextPickerOpen}
        onClose={() => setContextPickerOpen(false)}
        onAdd={handleAddContexts}
        existingItems={contexts}
      />
    </div>
  );
}
