"use client";

import type { ModelMetadata } from "@/lib/ai/modelRegistry";
import { cn } from "@/lib/utils";
import {
  Attachment01Icon,
  Mic01Icon,
  SentIcon,
  StopIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { ChatTextarea } from "./ChatTextarea";
import { ModelPicker } from "./ModelPicker";
import { ResponseModePicker } from "./ResponseModePicker";

interface ChatInputProps {
  onSend: (
    text: string,
  ) => void; /** Called with the trimmed message text when the user submits */
  onStop?: () => void; /** Called to stop generation */
  isLoading?: boolean; /** Whether the AI is currently generating */
  onVoiceToggle: () => void; /** Called when the voice-mode toggle button is pressed */
  isVoiceMode: boolean; /** Whether voice mode is currently active (styles the toggle) */
  onAddContext: () => void; /** Called when the attachment / add-context button is pressed */
  models: ModelMetadata[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  responseMode: "concise" | "descriptive";
  onResponseModeChange: (mode: "concise" | "descriptive") => void;
  contextPillsSlot?: React.ReactNode; /** Render context pills above the input (passed as a slot) */
  disabled?: boolean;
  compact?: boolean; /** When true, collapses to a single row when unfocused and empty */
  isGuest?: boolean;
  className?: string;
}

export default function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  onVoiceToggle,
  isVoiceMode,
  onAddContext,
  models,
  selectedModel,
  onModelChange,
  responseMode,
  onResponseModeChange,
  contextPillsSlot,
  disabled = false,
  compact = false,
  isGuest = false,
  className,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;
  const isCompact = compact && !hasText;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  return (
    <div className={cn("px-4 pb-4 shrink-0 z-10", className)}>
      <div className="max-w-3xl mx-auto flex flex-col relative">
        {/* Mobile context pills slot */}
        <div className="absolute bottom-full left-0 right-0 mb-0.5 w-full">
          {contextPillsSlot}
        </div>

        {/* Input row */}
        <div
          className={cn(
            "flex bg-muted/30 border border-border rounded-2xl p-2 transition-all duration-200",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            isCompact
              ? "flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
              : "flex-col gap-1",
          )}
        >
          {/* Attachment before textarea in compact mode (Desktop only) */}
          {isCompact && (
            <button
              onClick={onAddContext}
              title="Add context"
              aria-label="Add context"
              className="hidden sm:flex p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
            </button>
          )}

          <ChatTextarea
            value={value}
            onChange={setValue}
            onSend={handleSend}
            disabled={disabled}
            isCompact={isCompact}
          />

          <div
            className={cn(
              "flex items-center",
              isCompact
                ? "justify-between sm:justify-end gap-1 shrink-0"
                : "justify-between gap-1",
            )}
          >
            {/* Attachment in expanded mode or mobile compact (bottom row, left side) */}
            <button
              onClick={onAddContext}
              title="Add context"
              aria-label="Add context"
              className={cn(
                "p-1.5 sm:p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0",
                isCompact ? "flex sm:hidden" : "flex",
              )}
            >
              <HugeiconsIcon
                icon={Attachment01Icon}
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ResponseModePicker
                responseMode={responseMode}
                onResponseModeChange={onResponseModeChange}
              />

              <ModelPicker
                models={models}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                isGuest={isGuest}
              />

              <button
                onClick={
                  isLoading ? onStop : hasText ? handleSend : onVoiceToggle
                }
                disabled={disabled || (!isLoading && hasText && !value.trim())}
                aria-label={
                  isLoading
                    ? "Stop generation"
                    : hasText
                      ? "Send message"
                      : "Start voice mode"
                }
                aria-pressed={!isLoading && !hasText ? isVoiceMode : undefined}
                className={cn(
                  "p-1.5 sm:p-2 rounded-xl transition-all shrink-0",
                  isLoading || hasText
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : isVoiceMode
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <HugeiconsIcon
                  icon={isLoading ? StopIcon : hasText ? SentIcon : Mic01Icon}
                  className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[9px] text-muted-foreground/60 select-none">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
