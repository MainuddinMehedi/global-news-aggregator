"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Attachment01Icon,
  CheckmarkCircle02Icon,
  Mic01Icon,
  SentIcon,
  StopIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { ModelMetadata } from "@/lib/ai/modelRegistry";

interface ChatInputProps {
  /** Called with the trimmed message text when the user submits */
  onSend: (text: string) => void;
  /** Called to stop generation */
  onStop?: () => void;
  /** Whether the AI is currently generating */
  isLoading?: boolean;
  /** Called when the voice-mode toggle button is pressed */
  onVoiceToggle: () => void;
  /** Whether voice mode is currently active (styles the toggle) */
  isVoiceMode: boolean;
  /** Called when the attachment / add-context button is pressed */
  onAddContext: () => void;
  models: ModelMetadata[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  responseMode: "concise" | "descriptive";
  onResponseModeChange: (mode: "concise" | "descriptive") => void;
  adaptiveThinking: boolean;
  onAdaptiveThinkingChange: (enabled: boolean) => void;
  /** Render context pills above the input (passed as a slot) */
  contextPillsSlot?: React.ReactNode;
  disabled?: boolean;
  /** When true, collapses to a single row when unfocused and empty */
  compact?: boolean;
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
  adaptiveThinking,
  onAdaptiveThinkingChange,
  contextPillsSlot,
  disabled = false,
  compact = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeModel =
    models.find((model) => model.id === selectedModel) ?? models[0];
  const hasText = value.trim().length > 0;
  const isCompact = compact && !hasText;

  // Auto-resize textarea as the user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (isCompact) {
      el.style.height = "2.25rem"; // Explicitly set to 36px (h-9)
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [value, isCompact]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Ensure height reset after send
    if (textareaRef.current) {
      textareaRef.current.style.height = isCompact ? "2.25rem" : "3rem";
    }
  }, [value, disabled, onSend, isCompact]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 shrink-0 z-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
        {/* Mobile context pills slot */}
        {contextPillsSlot}

        {/* Input row */}
        <div
          className={cn(
            "flex bg-muted/30 border border-border rounded-2xl p-2 transition-all duration-200",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
            isCompact ? "flex-row items-center gap-2" : "flex-col gap-1",
          )}
        >
          {/* Attachment before textarea in compact mode */}
          {isCompact && (
            <button
              onClick={onAddContext}
              title="Add context"
              aria-label="Add context"
              className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
            </button>
          )}

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about geopolitical events, trends, or analysis…"
            rows={1}
            className={cn(
              "w-full bg-transparent resize-none outline-none px-2 text-sm placeholder:text-muted-foreground/70 disabled:opacity-50 scrollbar-sleek",
              isCompact ? "h-9 py-1.5 flex-1" : "min-h-[48px] max-h-32 py-2",
            )}
          />

          <div
            className={cn(
              "flex items-center",
              isCompact ? "gap-1 shrink-0" : "justify-between gap-1",
            )}
          >
            {/* Attachment in expanded mode (bottom row, left side) */}
            {!isCompact && (
              <button
                onClick={onAddContext}
                title="Add context"
                aria-label="Add context"
                className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Popover open={modePickerOpen} onOpenChange={setModePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose response mode"
                    className="h-8.5 max-w-[140px] inline-flex items-center gap-2 rounded-xl bg-background text-foreground px-3 text-xs font-medium hover:bg-accent transition-colors border border-border/70 capitalize"
                  >
                    <HugeiconsIcon
                      icon={TextFontIcon}
                      className="w-3.5 h-3.5 text-muted-foreground"
                    />
                    <span className="truncate">{responseMode}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={8}
                  className="w-[190px] gap-0 rounded-xl border border-border/80 bg-popover p-1 shadow-2xl"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResponseModeChange("concise");
                        setModePickerOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        responseMode === "concise"
                          ? "bg-accent/70 text-foreground"
                          : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-4">
                          Concise
                        </span>
                        <span className="block text-xs opacity-70 mt-0.5">
                          Direct answers, short bullets.
                        </span>
                      </span>
                      {responseMode === "concise" && (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResponseModeChange("descriptive");
                        setModePickerOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        responseMode === "descriptive"
                          ? "bg-accent/70 text-foreground"
                          : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-4">
                          Descriptive
                        </span>
                        <span className="block text-xs opacity-70 mt-0.5">
                          Full analysis, timelines, implications.
                        </span>
                      </span>
                      {responseMode === "descriptive" && (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        />
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={modelPickerOpen} onOpenChange={setModelPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose model"
                    className="h-8.5 max-w-[180px] inline-flex items-center gap-2 rounded-xl bg-background text-foreground px-3 text-xs font-medium hover:bg-accent transition-colors border border-border/70"
                  >
                    <span className="truncate">{activeModel?.label}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform",
                        modelPickerOpen && "rotate-180",
                      )}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={8}
                  className="w-[245px] gap-0 rounded-xl border border-border/80 bg-popover p-1 shadow-2xl"
                >
                  <div className="max-h-[320px] overflow-y-auto scrollbar-sleek">
                    {models.map((model) => {
                      const isSelected = model.id === selectedModel;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onModelChange(model.id);
                            setModelPickerOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            isSelected
                              ? "bg-accent/70 text-foreground"
                              : "hover:bg-accent/60",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium leading-5">
                              {model.label}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {model.description}
                            </span>
                          </span>
                          {isSelected && (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>


                </PopoverContent>
              </Popover>

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
                  "p-2 rounded-xl transition-all shrink-0",
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
                  className="w-[18px] h-[18px]"
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
