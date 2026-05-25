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
import { memo, useEffect, useRef, useState } from "react";
import { MODEL_LABELS } from "@/lib/ai/modelRegistry";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  scrollAnchorId?: string;
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SourceItem = {
  label: string;
  value: string;
  type: string;
  snippet?: string;
  published?: string;
  source?: string;
  sourceId?: string;
  mediaType?: string;
  engine?: string;
  toolName?: string;
};

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

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getUrlPath(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2)
      .join(" > ");
  } catch {
    return "";
  }
}

function formatPublishedDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatResourcePart(part: UIMessage["parts"][number]): SourceItem {
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

function extractToolResources(parts: UIMessage["parts"]): SourceItem[] {
  const items: SourceItem[] = [];
  for (const part of parts) {
    if (!isToolUIPart(part)) continue;
    const toolName = getToolName(part);
    const tp = part as {
      state: string;
      output?: Record<string, unknown>;
    };
    if (tp.state !== "output-available" || !tp.output) continue;
    const out = tp.output as {
      url?: string;
      title?: string;
      description?: string;
      content?: string;
      published?: string;
      source?: string;
      engine?: string;
      results?: Array<{
        url: string;
        title?: string;
        snippet?: string;
        published?: string;
        source?: string;
      }>;
    };
    if (out.results) {
      for (const r of out.results) {
        items.push({
          label: r.title || r.url,
          value: r.url,
          type: "source-url",
          snippet: r.snippet,
          published: r.published,
          source: r.source,
          engine: out.engine,
          toolName,
        });
      }
    }
    if (out.url && !items.some((i) => i.value === out.url)) {
      items.push({
        label: out.title || out.url,
        value: out.url,
        type: "source-url",
        snippet: out.description || out.content,
        published: out.published,
        source: out.source,
        engine: out.engine,
        toolName,
      });
    }
  }
  return items;
}

function dedupeSources(sources: SourceItem[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.value.replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function SourceResource({
  resource,
}: {
  resource: SourceItem;
}) {
  if (resource.type === "source-url") {
    const domain = getHostname(resource.value);
    const path = getUrlPath(resource.value);
    const published = formatPublishedDate(resource.published);

    return (
      <a
        href={resource.value}
        target="_blank"
        rel="noreferrer"
        className="block h-full rounded-xl border border-border/60 bg-muted/60 p-3 transition-colors hover:bg-muted"
      >
        <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-background text-[9px] font-semibold uppercase text-muted-foreground">
            {domain.slice(0, 1)}
          </span>
          <span className="truncate">{domain}</span>
          {path && (
            <span className="truncate text-muted-foreground/60">
              &gt; {path}
            </span>
          )}
        </div>
        <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {resource.label}
        </div>
        {(published || resource.snippet) && (
          <div className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {published ? `${published} - ` : ""}
            {resource.snippet}
          </div>
        )}
      </a>
    );
  }
  if (resource.type === "source-document") {
    return (
      <div className="h-full rounded-xl border border-border/60 bg-muted/60 p-3">
        <div className="font-semibold text-xs">{resource.label}</div>
        <div className="text-xs text-muted-foreground">
          {resource.mediaType}
          {resource.value ? ` - ${resource.value}` : ""}
        </div>
      </div>
    );
  }
  if (resource.label && resource.value) {
    return (
      <div className="h-full rounded-xl border border-border/60 bg-muted/60 p-3">
        <div className="font-semibold text-xs">{resource.label}</div>
        <div className="text-xs text-muted-foreground break-all">
          {resource.value}
        </div>
      </div>
    );
  }
  return null;
}

function SourcesStrip({ sources }: { sources: SourceItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleSources = showAll ? sources : sources.slice(0, 3);
  const toolLabel =
    sources.find((source) => source.toolName)?.toolName?.replace(/_/g, " ") ??
    "source";
  const engineLabel = sources.find((source) => source.engine)?.engine;

  return (
    <div className="mt-5 w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-sleek">
        {visibleSources.map((src, idx) => (
          <div key={`${src.value}-${idx}`} className="w-[280px] shrink-0">
            <SourceResource resource={src} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sources.length} source{sources.length === 1 ? "" : "s"}
          {engineLabel ? ` - ${toolLabel} via ${engineLabel}` : ""}
        </span>
        {sources.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            {showAll ? "Show less" : "View all"}
            <span aria-hidden="true">-&gt;</span>
          </button>
        )}
      </div>
    </div>
  );
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

  const hasTextContent = message.parts?.some(
    (p) => p.type === "text" && p.text,
  );
  const hasActiveReasoning = message.parts?.some(
    (p) => isReasoningUIPart(p) && p.state === "streaming",
  );
  const hasActiveToolUI = message.parts?.some((part) => {
    if (!isToolUIPart(part)) return false;
    const toolPart = part as { state: string };
    return (
      toolPart.state === "input-streaming" ||
      toolPart.state === "input-available"
    );
  });

  const showLoadingDots =
    isLastAndLoading &&
    !hasTextContent &&
    !hasActiveReasoning &&
    !hasActiveToolUI;

  const partResources = (message.parts ?? [])
    .filter(isSourceResourcePart)
    .map(formatResourcePart);
  const toolResources = extractToolResources(message.parts ?? []);
  const allSources = dedupeSources([...partResources, ...toolResources]);
  const hasSources = allSources.length > 0;

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
            "min-w-0",
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
                if (!isLastAndLoading) return null;
                return (
                  <div
                    key={index}
                    className="italic text-muted-foreground/70 text-sm mb-2"
                  >
                    {part.text || "Thinking..."}
                  </div>
                );
              }

              if (isToolUIPart(part)) {
                const toolName = getToolName(part);
                const toolPart = part as {
                  state: string;
                  output?: Record<string, unknown>;
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
                      {toolStatusLabel(toolName)} failed:{" "}
                      {toolPart.errorText}
                    </div>
                  );
                }

                if (isDone && toolPart.output) return null;
              }
              return null;
            })}
            {showLoadingDots && <InlineLoadingDots />}
          </>

          {hasSources && hasTextContent && <SourcesStrip sources={allSources} />}

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

function hasRenderableMessageContent(
  message: UIMessage,
  isLastAndLoading: boolean,
) {
  if (message.role !== "assistant") return true;
  if (isLastAndLoading) return true;
  return (message.parts ?? []).some((part) => {
    if (part.type === "text") return Boolean(part.text?.trim());
    if (!isToolUIPart(part)) return false;
    return (part as { state?: string }).state === "output-error";
  });
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
            isLastMessage && Boolean(isLoading) && msg.role === "assistant";
          if (!hasRenderableMessageContent(msg, isLastAndLoading)) {
            return null;
          }
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
