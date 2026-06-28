"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { getToolName, type UIMessage } from "ai";

function getToolInputValue(
  input: Record<string, unknown> | undefined,
  key: string,
) {
  const value = input?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toolStatusLabel(
  toolName: string,
  input?: Record<string, unknown>,
  state: "running" | "done" = "running",
): string {
  switch (toolName) {
    case "fetch_url": {
      const url = getToolInputValue(input, "url");
      const prefix = state === "done" ? "Grounded in" : "Accessing";
      return url ? `${prefix}: ${url}` : `${prefix} remote content`;
    }
    case "web_search": {
      const query = getToolInputValue(input, "query");
      const prefix = state === "done" ? "Researched" : "Searching web for";
      return query ? `${prefix}: "${query}"` : "Performing web search";
    }
    default:
      return state === "done" ? "Processed research step" : "Analyzing data...";
  }
}

function ToolStatusLine({
  label,
  isDone = false,
}: {
  label: string;
  isDone?: boolean;
}) {
  return (
    <div className="flex max-w-full items-center gap-2 text-xs text-muted-foreground/60 mb-2">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isDone
            ? "bg-muted-foreground/50"
            : "bg-muted-foreground/40 animate-pulse",
        )}
      />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}

interface CollapsibleToolLogsProps {
  toolParts: UIMessage["parts"];
  forceCollapse?: boolean;
}

export function CollapsibleToolLogs({
  toolParts,
  forceCollapse = false,
}: CollapsibleToolLogsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolParts || toolParts.length === 0) return null;

  // Find the first active tool (streaming or available)
  const activeTool = toolParts.find((part) => {
    const tp = part as { state: string };
    return tp.state === "input-streaming" || tp.state === "input-available";
  });

  const isAnyToolRunning = !!activeTool;

  // If a tool is running and we are not forced to collapse, we show it uncollapsed.
  if (isAnyToolRunning && !forceCollapse) {
    const toolName = getToolName(activeTool as Parameters<typeof getToolName>[0]);
    const tp = activeTool as {
      state: string;
      input?: Record<string, unknown>;
      rawInput?: Record<string, unknown>;
    };

    return (
      <ToolStatusLine
        label={toolStatusLabel(toolName, tp.input ?? tp.rawInput)}
      />
    );
  }

  // All tools are done (or error).
  const doneTools = toolParts.filter((part) => {
    const tp = part as { state: string; output?: Record<string, unknown> };
    return tp.state === "output-available" && tp.output;
  });

  if (doneTools.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 font-medium cursor-pointer"
      >
        <HugeiconsIcon
          icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
          className="w-3.5 h-3.5"
        />
        <span>
          Performed {doneTools.length} research step
          {doneTools.length === 1 ? "" : "s"}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-border/50 ml-1.5 py-1 mb-4">
          {doneTools.map((part, index) => {
            const toolName = getToolName(part as Parameters<typeof getToolName>[0]);
            const tp = part as {
              input?: Record<string, unknown>;
              rawInput?: Record<string, unknown>;
            };
            return (
              <ToolStatusLine
                key={index}
                label={toolStatusLabel(
                  toolName,
                  tp.input ?? tp.rawInput,
                  "done",
                )}
                isDone
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
