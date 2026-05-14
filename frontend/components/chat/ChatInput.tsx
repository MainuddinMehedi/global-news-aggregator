"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  HeadphonesIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  /** Called with the trimmed message text when the user submits */
  onSend: (text: string) => void;
  /** Called when the voice-mode toggle button is pressed */
  onVoiceToggle: () => void;
  /** Whether voice mode is currently active (styles the toggle) */
  isVoiceMode: boolean;
  /** Called when the attachment / add-context button is pressed */
  onAddContext: () => void;
  /** Render context pills above the input (passed as a slot) */
  contextPillsSlot?: React.ReactNode;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  onVoiceToggle,
  isVoiceMode,
  onAddContext,
  contextPillsSlot,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as the user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 shrink-0 z-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {/* Mobile context pills slot */}
        {contextPillsSlot}

        {/* Input row */}
        <div
          className={cn(
            "flex items-end gap-2 bg-muted/30 border border-border rounded-2xl p-2 transition-all",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
          )}
        >
          {/* Attachment / add context */}
          <button
            onClick={onAddContext}
            title="Add context"
            aria-label="Add context"
            className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
          </button>

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about geopolitical events, trends, or analysis…"
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 bg-transparent resize-none outline-none py-3 text-sm placeholder:text-muted-foreground/70 disabled:opacity-50"
          />

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Voice mode toggle */}
            <button
              onClick={onVoiceToggle}
              title="Voice mode"
              aria-label="Toggle voice mode"
              aria-pressed={isVoiceMode}
              className={cn(
                "p-2.5 rounded-xl transition-colors shrink-0",
                isVoiceMode
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={HeadphonesIcon} className="w-5 h-5" />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-all shrink-0 shadow-md"
            >
              <HugeiconsIcon icon={SentIcon} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground select-none">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
