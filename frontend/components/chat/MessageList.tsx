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

function isSourceResourcePart(part: UIMessage["parts"][number]): part is { type: "source-url"; url: string; title?: string; sourceId: string } | { type: "source-document"; sourceId: string; mediaType: string; title: string; filename?: string } {
  return part.type === "source-url" || part.type === "source-document";
}

function formatResourcePart(part: UIMessage["parts"][number]) {
  if (part.type === "source-url") {
    return {
      label: part.title || part.url,
      value: part.url,
      type: "source-url" as const,
      sourceId: part.sourceId,
    };
  }

  if (part.type === "source-document") {
    return {
      label: part.title,
      value: part.filename ?? part.sourceId,
      type: "source-document" as const,
      mediaType: part.mediaType,
      sourceId: part.sourceId,
    };
  }

  return {
    label: "Unknown resource",
    value: JSON.stringify(part),
    type: "unknown" as const,
  };
}

function MessageBubble({ message, isLastAndLoading }: { message: UIMessage; isLastAndLoading?: boolean }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const metadata = message.metadata as Record<string, unknown> | undefined;
  const isError = !isUser && !isSystem && metadata?.error === true;
  const model = !isUser && !isSystem
    ? (metadata as { model?: string })?.model
    : undefined;
  const modelLabel = model ? (MODEL_LABELS[model] ?? model) : undefined;
  const metadataResources =
    metadata?.resources ?? metadata?.sources ?? metadata?.executed_tools ?? metadata?.tools;
  const partResources = (message.parts ?? [])
    .filter(isSourceResourcePart)
    .map(formatResourcePart);
  const resources = Array.isArray(metadataResources)
    ? [...metadataResources, ...partResources]
    : metadataResources
    ? [metadataResources, ...partResources]
    : partResources;
  const hasResources = Array.isArray(resources)
    ? resources.length > 0
    : typeof resources === "object" && resources !== null && Object.keys(resources).length > 0;

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
              : isSystem
              ? "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-tl-sm w-full overflow-hidden"
              : isError
              ? "bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 rounded-tl-sm w-full overflow-hidden"
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
          {hasResources && (
            <div className="mt-4 rounded-2xl border border-border/70 bg-background/80 p-3 text-xs text-muted-foreground">
              <div className="mb-2 font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Resources used
              </div>
              {Array.isArray(resources) ? (
                <div className="grid gap-2">
                  {resources.map((resource, idx) => (
                    <div key={idx} className="rounded-xl border border-border/50 bg-muted/70 p-3">
                      {typeof resource === "object" && resource !== null ? (
                        'type' in resource && resource.type === 'source-url' ? (
                          <div>
                            <div className="font-semibold text-[11.5px]">{resource.label}</div>
                            <a
                              href={resource.value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-[11.5px] break-all"
                            >
                              {resource.value}
                            </a>
                          </div>
                        ) : 'type' in resource && resource.type === 'source-document' ? (
                          <div>
                            <div className="font-semibold text-[11.5px]">{resource.label}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {resource.mediaType}{resource.value ? ` · ${resource.value}` : ''}
                            </div>
                          </div>
                        ) : 'label' in resource && 'value' in resource ? (
                          <div>
                            <div className="font-semibold text-[11.5px]">{String(resource.label)}</div>
                            <div className="text-[11px] text-muted-foreground break-all">{String(resource.value)}</div>
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap wrap-break-word text-[11.5px]">{JSON.stringify(resource, null, 2)}</pre>
                        )
                      ) : (
                        <div>{String(resource)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : typeof resources === "object" && resources !== null ? (
                <pre className="whitespace-pre-wrap wrap-break-word text-[11.5px]">{JSON.stringify(resources, null, 2)}</pre>
              ) : (
                <div>{String(resources)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {modelLabel && !isSystem && (
        <div className="text-[10px] text-muted-foreground/60 pl-11 mt-1">
          {modelLabel}
        </div>
      )}
      {isSystem && (
        <div className="text-[10px] text-red-600/60 pl-11 mt-1">
          System Error
        </div>
      )}
    </div>
  );
}

// Memoize MessageBubble to prevent re-renders when other messages change
function areMessagePartsEqual(
  prevParts: UIMessage["parts"],
  nextParts: UIMessage["parts"],
) {
  if (prevParts === nextParts) return true;
  if (prevParts.length !== nextParts.length) return false;
  return prevParts.every((part, index) => {
    const next = nextParts[index];
    if (part.type !== next.type) return false;
    return JSON.stringify(part) === JSON.stringify(next);
  });
}

const MemoMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
  // Only re-render if the message content or loading state actually changed
  const prevMetadata = prevProps.message.metadata;
  const nextMetadata = nextProps.message.metadata;
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.role === nextProps.message.role &&
    areMessagePartsEqual(prevProps.message.parts, nextProps.message.parts) &&
    prevProps.isLastAndLoading === nextProps.isLastAndLoading &&
    JSON.stringify(prevMetadata) === JSON.stringify(nextMetadata)
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
