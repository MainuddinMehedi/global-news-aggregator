"use client";

import { cn } from "@/lib/utils";
import { Robot01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { memo, useEffect, useRef } from "react";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  /** Ref forwarded to the scroll anchor — must be passed from the parent client component */
  scrollAnchorId?: string;
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MODEL_LABELS: Record<string, string> = {
  "groq/compound": "Compound (Web Search)",
  "groq/compound-mini": "Compound Mini",
  "llama-3.3-70b-versatile": "Llama 3.3 70B",
  "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

// Memoized markdown renderer to prevent re-parsing on every character
const MemoizedMarkdown = memo(
  ({ text }: { text: string }) => (
    <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.text === nextProps.text,
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

function MessageBubble({ message, isLastAndLoading }: { message: UIMessage; isLastAndLoading?: boolean }) {
  const isUser = message.role === "user";
  const model = !isUser
    ? (message.metadata as { model?: string })?.model
    : undefined;
  const modelLabel = model ? (MODEL_LABELS[model] ?? model) : undefined;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex gap-3 max-w-[70%]",
          isUser ? "flex-row-reverse" : "",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex shrink-0 items-center justify-center mt-1 shadow-sm",
            isUser ? "bg-muted" : "bg-primary/10 border border-primary/20",
          )}
        >
          {isUser ? (
            <HugeiconsIcon
              icon={UserIcon}
              className="w-5 h-5 text-muted-foreground"
            />
          ) : (
            <HugeiconsIcon
              icon={Robot01Icon}
              className="w-5 h-5 text-primary"
            />
          )}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm w-full overflow-hidden",
          )}
        >
          {!isUser && isLastAndLoading && !message.parts?.some(p => p.type === "text" && p.text) ? (
            // Show loading dots if streaming but no content yet
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <>
              {message.parts?.map((part, index) => {
                if (part.type === "text") {
                  return isUser ? (
                    <div key={index}>{part.text}</div>
                  ) : (
                    <MemoizedMarkdown key={index} text={part.text} />
                  );
                }
                if (part.type === "reasoning") {
                  return (
                    <div
                      key={index}
                      className="italic text-muted-foreground mb-2 p-2 bg-muted/20 rounded-md border border-border/30"
                    >
                      <span className="font-semibold text-xs uppercase mb-1 block">
                        Reasoning
                      </span>
                      <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word whitespace-pre-wrap">
                        {part.text}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </>
          )}
        </div>
      </div>

      {modelLabel && (
        <div className="text-[10px] text-muted-foreground/60 pl-11 mt-1">
          {modelLabel}
        </div>
      )}
    </div>
  );
}

// Memoize MessageBubble to prevent re-renders when other messages change
const MemoMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  // Only re-render if the message content or loading state actually changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.parts === nextProps.message.parts &&
    prevProps.isLastAndLoading === nextProps.isLastAndLoading
  );
});

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use requestAnimationFrame to batch scroll updates and prevent jank
    const timer = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Auto-scroll only if user is near the bottom (within 100px)
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [messages]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 flex flex-col gap-5 scrollbar-sleek">
      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isLastAndLoading = isLastMessage && isLoading && msg.role === "assistant";
        return (
          <MemoMessageBubble key={msg.id} message={msg} isLastAndLoading={isLastAndLoading} />
        );
      })}

    </div>
  );
}
