"use client";

import { cn } from "@/lib/utils";
import { Robot01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  getToolName,
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { memo, useEffect, useRef } from "react";
import { MODEL_LABELS } from "@/lib/ai/modelRegistry";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  scrollAnchorId?: string;
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MemoizedMarkdown = memo(
  ({ text }: { text: string }) => (
    <div className="prose dark:prose-invert max-w-none wrap-break-word">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          em: ({ children }) => <em className="text-sm">{children}</em>,
        }}
      >
        {text}
      </ReactMarkdown>
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

function StreamingText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap wrap-break-word">
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-foreground/60 ml-0.5 animate-blink align-text-bottom" />
    </div>
  );
}

function InlineLoadingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

function toolStatusLabel(toolName: string): string {
  switch (toolName) {
    case "fetch_url":
      return "Fetching URL";
    case "web_search":
      return "Searching the web";
    default:
      return "Running tool";
  }
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

  const hasTextContent = message.parts?.some(
    (p) => p.type === "text" && p.text,
  );
  const hasActiveReasoning = message.parts?.some(
    (p) => isReasoningUIPart(p) && p.state === "streaming",
  );
  const hasToolUI = message.parts?.some(isToolUIPart);

  const showLoadingDots =
    isLastAndLoading && !hasTextContent && !hasActiveReasoning && !hasToolUI;

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
          <>
            {message.parts?.map((part, index) => {
              if (part.type === "text") {
                if (isUser) {
                  return <div key={index}>{part.text}</div>;
                }
                if (isLastAndLoading) {
                  return <StreamingText key={index} text={part.text} />;
                }
                return <MemoizedMarkdown key={index} text={part.text} />;
              }

              if (isReasoningUIPart(part)) {
                return (
                  <div
                    key={index}
                    className="italic text-muted-foreground/70 text-sm mb-2"
                  >
                    {part.text ||
                      (part.state === "streaming" ? "Thinking..." : "")}
                  </div>
                );
              }

              if (isToolUIPart(part)) {
                const toolName = getToolName(part);
                const toolPart = part as {
                  state: string;
                  output?: unknown;
                  errorText?: string;
                };
                const isSearching =
                  toolPart.state === "input-streaming" ||
                  toolPart.state === "input-available";
                const isError = toolPart.state === "output-error";
                const isDone = toolPart.state === "output-available";

                if (isSearching) {
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-muted-foreground/60 mb-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                      {toolStatusLabel(toolName)}
                    </div>
                  );
                }

                if (isError) {
                  return (
                    <div key={index} className="text-xs text-red-500 mb-2">
                      {toolStatusLabel(toolName)} failed: {toolPart.errorText}
                    </div>
                  );
                }

                if (isDone && toolPart.output) {
                  const output = toolPart.output as {
                    engine?: string;
                    results?: Array<{
                      title: string;
                      url: string;
                      snippet: string;
                      source?: string;
                    }>;
                  };
                  if (output.results?.length) {
                    return (
                      <div
                        key={index}
                        className="my-4 rounded-xl border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground"
                      >
                        <div className="mb-2 font-semibold uppercase tracking-[0.16em] text-muted-foreground text-xs">
                          Web Search Results{" "}
                          {output.engine ? `(via ${output.engine})` : ""}
                        </div>
                        <div className="grid gap-2">
                          {output.results.map((r, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-border/50 bg-muted/70 p-2.5"
                            >
                              <div className="font-semibold text-xs mb-0.5">
                                {r.title}
                              </div>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline text-[11px] break-all"
                              >
                                {r.url}
                              </a>
                              <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                {r.snippet}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
              }
              return null;
            })}
            {showLoadingDots && <InlineLoadingDots />}
          </>
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
          {modelLabel && !isSystem && !isUser && (
            <div className="text-[10px] text-muted-foreground/60 mt-2">
              Generated by {modelLabel}
            </div>
          )}
        </div>
      </div>
      {isSystem && (
        <div className="text-xs text-red-600/60 mt-1.5">System Error</div>
      )}
    </div>
  );
}

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
    const timer = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
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
