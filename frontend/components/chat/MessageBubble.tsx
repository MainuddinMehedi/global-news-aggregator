"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Robot01Icon,
  UserIcon,
  ArrowRight01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MODEL_LABELS } from "@/lib/ai/modelRegistry";
import { CitationsStrip } from "./CitationsStrip";
import { CollapsibleToolLogs } from "./CollapsibleToolLogs";
import {
  normalizeMarkdownText,
  areMessagePartsEqual,
} from "@/lib/chat/messages";

const MemoizedMarkdown = memo(
  ({ text }: { text: string }) => (
    <div className="prose dark:prose-invert max-w-none wrap-break-word prose-stream">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          em: ({ children }) => <em className="text-sm">{children}</em>,
          pre: ({ children }) => (
            <pre className="whitespace-pre-wrap wrap-break-word overflow-x-hidden bg-muted/20 p-3 rounded-lg border border-border/40 my-3">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-muted/30 px-1.5 py-0.5 rounded text-primary text-[0.9em] font-mono">
                {children}
              </code>
            ) : (
              <code className="whitespace-pre-wrap wrap-break-word block">
                {children}
              </code>
            );
          },
        }}
      >
        {normalizeMarkdownText(text)}
      </ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.text === nextProps.text,
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

function InlineLoadingDots({ label = "Thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground/70">
      <span>{label}</span>
      <span className="flex items-center gap-1">
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
      </span>
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
    (p) => isReasoningUIPart(p) && (p.text?.length ?? 0) > 0,
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
            {(() => {
              const textParts =
                message.parts?.filter((p) => p.type === "text") || [];
              const reasoningParts =
                message.parts?.filter((p) => isReasoningUIPart(p)) || [];
              const toolParts =
                message.parts?.filter((p) => isToolUIPart(p)) || [];

              const hasStartedAnswer = textParts.some(
                (p) => p.type === "text" && (p.text?.trim().length || 0) > 0,
              );

              return (
                <>
                  {reasoningParts.map((part, index) => {
                    if (isReasoningUIPart(part)) {
                      if (!part.text && !isLastAndLoading) return null;

                      // Collapse reasoning if we have any answer text or if turn is done
                      const shouldCollapse =
                        !isLastAndLoading || hasStartedAnswer;

                      return (
                        <div key={`reasoning-${index}`} className="mb-3">
                          {!shouldCollapse ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-primary/70 select-none">
                                <span className="flex items-center gap-1.5">
                                  <HugeiconsIcon
                                    icon={ArrowDown01Icon}
                                    className="w-3 h-3"
                                  />{" "}
                                  Thinking
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <span
                                    className="w-0.5 h-0.5 rounded-full bg-primary/40 animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  />
                                  <span
                                    className="w-0.5 h-0.5 rounded-full bg-primary/40 animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  />
                                  <span
                                    className="w-0.5 h-0.5 rounded-full bg-primary/40 animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  />
                                </span>
                              </div>
                              <div className="italic text-muted-foreground/80 text-sm whitespace-pre-wrap break-words pl-4 border-l border-primary/20 leading-relaxed font-serif">
                                {part.text || "Analyzing query..."}
                              </div>
                            </div>
                          ) : (
                            <details className="group border border-border/40 rounded-md overflow-hidden bg-muted/10">
                              <summary className="text-xs font-medium cursor-pointer py-1.5 px-3 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center select-none text-muted-foreground/70">
                                <span className="group-open:hidden flex items-center gap-1.5">
                                  <HugeiconsIcon
                                    icon={ArrowRight01Icon}
                                    className="w-3 h-3"
                                  />{" "}
                                  View Thought Process
                                </span>
                                <span className="hidden group-open:flex items-center gap-1.5">
                                  <HugeiconsIcon
                                    icon={ArrowDown01Icon}
                                    className="w-3 h-3"
                                  />{" "}
                                  Hide Thought Process
                                </span>
                              </summary>
                              <div className="p-3 text-[11px] text-muted-foreground/80 whitespace-pre-wrap break-words font-mono leading-relaxed border-t border-border/30 bg-muted/5 max-w-full overflow-x-hidden">
                                {part.text}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}

                  {toolParts.length > 0 && (
                    <div className="mb-3">
                      <CollapsibleToolLogs
                        toolParts={toolParts}
                        forceCollapse={hasStartedAnswer}
                      />
                    </div>
                  )}

                  {textParts.map((part, index) => {
                    if (part.type === "text") {
                      if (isUser) {
                        return (
                          <div
                            key={`text-${index}`}
                            className="whitespace-pre-wrap"
                          >
                            {part.text}
                          </div>
                        );
                      }

                      // Render markdown even while streaming for a fluid experience
                      return (
                        <div key={`text-${index}`} className="relative">
                          <MemoizedMarkdown text={part.text} />

                          {isLastAndLoading &&
                            index === textParts.length - 1 && (
                              <span className="inline-block w-1.5 h-4 bg-primary/50 ml-0.5 animate-pulse align-middle" />
                            )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </>
              );
            })()}
            {showLoadingDots && <InlineLoadingDots />}
          </>

          {hasTextContent && (
            <CitationsStrip messageParts={message.parts ?? []} />
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

export const MemoMessageBubble = memo(MessageBubble, (prevProps, nextProps) => {
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

MemoMessageBubble.displayName = "MemoMessageBubble";
