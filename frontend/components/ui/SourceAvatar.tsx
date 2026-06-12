"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Source {
  name: string;
  url: string;
}

interface SourceAvatarProps {
  name: string;
  url: string;
  className?: string;
}

interface SourceAvatarStackProps {
  sources: Source[];
  max?: number;
  className?: string;
}

function getDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    // Basic regex fallback if url is not a full URL
    const match = urlStr.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
    return match ? match[1] : "";
  }
}

export function SourceAvatar({ name, url, className }: SourceAvatarProps) {
  const [error, setError] = useState(false);
  const domain = getDomain(url);
  
  // Custom mapping for common local sources if needed
  let faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : null;

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  if (error || !faviconUrl) {
    return (
      <div
        title={name}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-[9px] font-black font-sans text-secondary-foreground select-none shadow-xs",
          className || "h-6 w-6"
        )}
      >
        {initials || name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={name}
      title={name}
      onError={() => setError(true)}
      className={cn(
        "inline-block shrink-0 rounded-full border border-border bg-card object-contain p-0.5 shadow-xs",
        className || "h-6 w-6"
      )}
    />
  );
}

export function SourceAvatarStack({ sources, max = 4, className }: SourceAvatarStackProps) {
  if (!sources || sources.length === 0) return null;

  const uniqueSourcesMap = new Map<string, string>();
  sources.forEach(s => {
    if (s.name && !uniqueSourcesMap.has(s.name)) {
      uniqueSourcesMap.set(s.name, s.url);
    }
  });

  const uniqueSources = Array.from(uniqueSourcesMap.entries()).map(([name, url]) => ({
    name,
    url,
  }));

  const displayedSources = uniqueSources.slice(0, max);
  const remainingCount = uniqueSources.length - max;

  return (
    <div className={cn("flex items-center -space-x-2 overflow-hidden", className)}>
      {displayedSources.map((src) => (
        <SourceAvatar
          key={src.name}
          name={src.name}
          url={src.url}
          className="h-6 w-6 ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground ring-2 ring-background select-none shadow-xs">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
