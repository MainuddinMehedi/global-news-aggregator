"use client";

import { useState } from "react";
import { type UIMessage } from "ai";
import { getHostname, getUrlPath, formatPublishedDate } from "@/lib/utils";
import {
  type SourceItem,
  isSourceResourcePart,
  formatResourcePart,
  extractToolResources,
  dedupeSources,
} from "@/lib/chat/messageCitations";

function MessageCitations({ resource }: { resource: SourceItem }) {
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

interface CitationsStripProps {
  messageParts: UIMessage["parts"];
}

export function CitationsStrip({ messageParts }: CitationsStripProps) {
  const [showAll, setShowAll] = useState(false);

  const partResources = messageParts
    .filter(isSourceResourcePart)
    .map(formatResourcePart);
  const toolResources = extractToolResources(messageParts);
  const allSources = dedupeSources([...partResources, ...toolResources]);

  if (allSources.length === 0) return null;

  const visibleSources = showAll ? allSources : allSources.slice(0, 3);
  const toolLabel =
    allSources
      .find((source) => source.toolName)
      ?.toolName?.replace(/_/g, " ") ?? "source";
  const engineLabel = allSources.find((source) => source.engine)?.engine;

  return (
    <div className="mt-5 w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-sleek">
        {visibleSources.map((src, idx) => (
          <div key={`${src.value}-${idx}`} className="w-[280px] shrink-0">
            <MessageCitations resource={src} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {allSources.length} source{allSources.length === 1 ? "" : "s"}
          {engineLabel ? ` - ${toolLabel} via ${engineLabel}` : ""}
        </span>
        {allSources.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
          >
            {showAll ? "Show less" : "View all"}
            <span aria-hidden="true">-&gt;</span>
          </button>
        )}
      </div>
    </div>
  );
}
