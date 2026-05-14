// Server component — no state, no hooks.
import { HugeiconsIcon } from "@hugeicons/react";
import { Robot01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

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

function MessageBubble({ message }: { message: UIMessage }) {
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
          {message.parts?.map((part, index) => {
            if (part.type === "text") {
              return isUser ? (
                <div key={index}>{part.text}</div>
              ) : (
                <div
                  key={index}
                  className="prose prose-sm dark:prose-invert max-w-none break-words"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
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
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                    {part.text}
                  </div>
                </div>
              );
            }
            return null;
          })}
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

/**
 * Pure display list — renders messages.
 * The scroll anchor `div#chat-scroll-anchor` is rendered here so the parent
 * client component can call `document.getElementById("chat-scroll-anchor")
 * ?.scrollIntoView()` without needing a ref on this server component.
 */
export default function MessageList({ messages, isLoading }: MessageListProps) {
  const showLoading =
    isLoading && messages[messages.length - 1]?.role === "user";

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-5 scrollbar-sleek">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Loading Indicator */}
      {showLoading && (
        <div className="flex gap-3 max-w-[70%] self-start animate-in fade-in zoom-in duration-300">
          <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center mt-1 shadow-sm bg-primary/10 border border-primary/20">
            <HugeiconsIcon
              icon={Robot01Icon}
              className="w-5 h-5 text-primary"
            />
          </div>
          <div className="rounded-2xl px-4 py-3 shadow-sm text-sm bg-muted/50 border border-border/50 text-foreground rounded-tl-sm flex items-center gap-1.5 h-[44px]">
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

      {/* Scroll anchor — targeted by the parent via getElementById */}
      <div id="chat-scroll-anchor" aria-hidden="true" />
    </div>
  );
}
