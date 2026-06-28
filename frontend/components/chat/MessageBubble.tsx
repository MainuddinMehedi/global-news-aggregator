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
                  {reasoningParts.length > 0 && (() => {
                    const combinedText = reasoningParts
                      .map((p) => p.text || "")
                      .filter(Boolean)
                      .join("\\n\\n");

                    if (!combinedText && !isLastAndLoading) return null;

                    return (
                      <details className="group mb-2">
                        <summary className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            className="w-3.5 h-3.5 group-open:hidden"
                          />
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            className="w-3.5 h-3.5 hidden group-open:block"
                          />
                          <span>Thought Process</span>
                        </summary>
                        <div className="pl-4 border-l-2 border-border/50 ml-1.5 py-1 mt-2 mb-2 text-[11px] text-muted-foreground/80 whitespace-pre-wrap break-words font-mono leading-relaxed max-w-full overflow-x-hidden">
                          {combinedText || "Analyzing query..."}
                        </div>
                      </details>
                    );
                  })()}

                  {toolParts.length > 0 && (
                    <CollapsibleToolLogs
                      toolParts={toolParts}
                      forceCollapse={hasStartedAnswer}
                    />
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
