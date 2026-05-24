"use client";

import { cn } from "@/lib/utils";
import { Robot01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UIMessage } from "ai";
import { memo, useEffect, useRef } from "react";
import { MODEL_LABELS } from "@/lib/ai/modelRegistry";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  /** Ref forwarded to the scroll anchor — must be passed from the parent client component */
  scrollAnchorId?: string;
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Memoized markdown renderer to prevent re-parsing on every character
const MemoizedMarkdown = memo(
  ({ text }: { text: string }) => (
    <div className="prose dark:prose-invert max-w-none wrap-break-word">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.text === nextProps.text,
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

function isSourceResourcePart(part: UIMessage["parts"][number]): part is
  | { type: "source-url"; url: string; title?: string; sourceId: string }
  | {
      type: "source-document";
      sourceId: string;
      mediaType: string;
      title: string;
      filename?: string;
    } {
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

function MessageBubble({
  message,
  isLastAndLoading,
}: {
  message: UIMessage;
  isLastAndLoading?: boolean;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const metadata = message.metadata as Record<string, unknown> | undefined;
  const isError = !isUser && !isSystem && metadata?.error === true;
  const model =
    !isUser && !isSystem ? (metadata as { model?: string })?.model : undefined;
  const modelLabel = model ? (MODEL_LABELS[model] ?? model) : undefined;
  const metadataResources =
    metadata?.resources ??
    metadata?.sources ??
    metadata?.executed_tools ??
    metadata?.tools;
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
    : typeof resources === "object" &&
      resources !== null &&
      Object.keys(resources).length > 0;

  return (
    <div
      className={cn(
        "flex flex-col w-full",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "flex gap-3",
          isUser ? "flex-row-reverse max-w-[85%]" : "w-full",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex shrink-0 items-center justify-center mt-1",
            isUser
              ? "bg-muted shadow-sm"
              : "bg-primary/10 border border-primary/20",
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

        {/* Content */}
        <div
          className={cn(
            isUser ? "text-sm leading-relaxed" : "text-base leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm"
              : isSystem
                ? "text-red-700 dark:text-red-400 w-full"
                : isError
                  ? "text-red-900 dark:text-red-200 w-full"
                  : "text-foreground w-full",
          )}
        >
          {!isUser &&
          isLastAndLoading &&
          !message.parts?.some((p) => p.type === "text" && p.text) ? (
            // Show loading dots if streaming but no content yet
            <div className="flex items-center gap-1.5 px-1 py-2">
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
                      className="italic text-muted-foreground mb-4 p-3 bg-muted/20 rounded-md border border-border/30"
                    >
                      <span className="font-semibold text-sm uppercase mb-1 block">
                        Reasoning
                      </span>
                      <div className="prose dark:prose-invert max-w-none wrap-break-word whitespace-pre-wrap">
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
            <div className="mt-4 rounded-xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground inline-block">
              <div className="mb-2 font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sources
              </div>
              {Array.isArray(resources) ? (
                <div className="grid gap-2">
                  {resources.map((resource, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/50 bg-muted/70 p-2.5"
                    >
                      {typeof resource === "object" && resource !== null ? (
                        "type" in resource && resource.type === "source-url" ? (
                          <div>
                            <div className="font-semibold text-xs">
                              {resource.label}
                            </div>
                            <a
                              href={resource.value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-xs break-all"
                            >
                              {resource.value}
                            </a>
                          </div>
                        ) : "type" in resource &&
                          resource.type === "source-document" ? (
                          <div>
                            <div className="font-semibold text-xs">
                              {resource.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {resource.mediaType}
                              {resource.value ? ` · ${resource.value}` : ""}
                            </div>
                          </div>
                        ) : "label" in resource && "value" in resource ? (
                          <div>
                            <div className="font-semibold text-xs">
                              {String(resource.label)}
                            </div>
                            <div className="text-xs text-muted-foreground break-all">
                              {String(resource.value)}
                            </div>
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                            {JSON.stringify(resource, null, 2)}
                          </pre>
                        )
                      ) : (
                        <div>{String(resource)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : typeof resources === "object" && resources !== null ? (
                <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                  {JSON.stringify(resources, null, 2)}
                </pre>
              ) : (
                <div>{String(resources)}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {modelLabel && !isSystem && !isUser && (
        <div className="text-xs text-muted-foreground/60 mt-1.5">
          Generated by {modelLabel}
        </div>
      )}
      {isSystem && (
        <div className="text-xs text-red-600/60 mt-1.5">System Error</div>
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
    <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-sleek">
      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-6">
        {messages.map((msg, idx) => {
          const isLastMessage = idx === messages.length - 1;
          const isLastAndLoading =
            isLastMessage && isLoading && msg.role === "assistant";
          return (
            <MemoMessageBubble
              key={msg.id}
              message={msg}
              isLastAndLoading={isLastAndLoading}
            />
          );
        })}
      </div>
    </div>
  );
}
