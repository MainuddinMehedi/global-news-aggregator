import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isCompact?: boolean;
}

export function ChatTextarea({
  value,
  onChange,
  onSend,
  disabled = false,
  isCompact = false,
}: ChatTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Reset height when submitted via Enter
  useEffect(() => {
    if (value === "" && textareaRef.current) {
      textareaRef.current.style.height = isCompact ? "2.25rem" : "3rem";
    }
  }, [value, isCompact]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="Ask about geopolitical events, trends, or analysis…"
      rows={1}
      className={cn(
        "w-full bg-transparent resize-none outline-none px-2 text-sm placeholder:text-muted-foreground/70 disabled:opacity-50 scrollbar-sleek",
        isCompact ? "h-9 py-1.5 flex-1" : "min-h-[48px] max-h-32 py-2",
      )}
    />
  );
}
