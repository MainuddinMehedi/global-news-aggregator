"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Attachment01Icon,
  CheckmarkCircle02Icon,
  Mic01Icon,
  SentIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { ChatModelOption } from "./models";

interface ChatInputProps {
  /** Called with the trimmed message text when the user submits */
  onSend: (text: string) => void;
  /** Called when the voice-mode toggle button is pressed */
  onVoiceToggle: () => void;
  /** Whether voice mode is currently active (styles the toggle) */
  isVoiceMode: boolean;
  /** Called when the attachment / add-context button is pressed */
  onAddContext: () => void;
  models: ChatModelOption[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  responseMode: "concise" | "descriptive";
  onResponseModeChange: (mode: "concise" | "descriptive") => void;
  adaptiveThinking: boolean;
  onAdaptiveThinkingChange: (enabled: boolean) => void;
  /** Render context pills above the input (passed as a slot) */
  contextPillsSlot?: React.ReactNode;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
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
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeModel =
    models.find((model) => model.id === selectedModel) ?? models[0];
  const hasText = value.trim().length > 0;

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
            "flex flex-col gap-1 bg-muted/30 border border-border rounded-2xl p-2 transition-all",
            "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
          )}
        >
          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about geopolitical events, trends, or analysis…"
            rows={1}
            className="w-full min-h-[48px] max-h-32 bg-transparent resize-none outline-none px-2 py-3 text-sm placeholder:text-muted-foreground/70 disabled:opacity-50"
          />

          <div className="flex items-center justify-between gap-2">
            {/* Attachment / add context */}
            <button
              onClick={onAddContext}
              title="Add context"
              aria-label="Add context"
              className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <HugeiconsIcon icon={Attachment01Icon} className="w-5 h-5" />
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Popover open={modePickerOpen} onOpenChange={setModePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose response mode"
                    className="h-9 max-w-[140px] inline-flex items-center gap-1.5 rounded-xl bg-background text-foreground px-3 text-xs font-medium hover:bg-accent transition-colors border border-border/70 capitalize"
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
                  className="w-[200px] gap-0 rounded-xl border border-border/80 bg-popover p-1 shadow-2xl"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onResponseModeChange("concise");
                        setModePickerOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        responseMode === "concise"
                          ? "bg-accent/70 text-foreground"
                          : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-5">
                          Concise
                        </span>
                        <span className="block text-xs opacity-80 mt-0.5">
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
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        responseMode === "descriptive"
                          ? "bg-accent/70 text-foreground"
                          : "hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-5">
                          Descriptive
                        </span>
                        <span className="block text-xs opacity-80 mt-0.5">
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
                    className="h-9 max-w-[180px] inline-flex items-center gap-1.5 rounded-xl bg-background text-foreground px-3 text-xs font-medium hover:bg-accent transition-colors border border-border/70"
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

                  <div className="my-1 h-px bg-border/80" />

                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-5">
                        Adaptive thinking
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Thinks for more complex tasks
                      </div>
                    </div>
                    <Switch
                      checked={adaptiveThinking}
                      onCheckedChange={onAdaptiveThinkingChange}
                      aria-label="Toggle adaptive thinking"
                    />
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                  >
                    <span>More models</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      className="h-4 w-4 -rotate-90"
                    />
                  </button>
                </PopoverContent>
              </Popover>

              <button
                onClick={hasText ? handleSend : onVoiceToggle}
                disabled={disabled || (hasText && !value.trim())}
                aria-label={hasText ? "Send message" : "Start voice mode"}
                aria-pressed={!hasText ? isVoiceMode : undefined}
                className={cn(
                  "p-2.5 rounded-xl transition-all shrink-0",
                  hasText
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : isVoiceMode
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <HugeiconsIcon
                  icon={hasText ? SentIcon : Mic01Icon}
                  className="w-5 h-5"
                />
              </button>
            </div>
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
