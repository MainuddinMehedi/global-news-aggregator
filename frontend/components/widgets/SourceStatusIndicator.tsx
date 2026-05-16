"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SourceStatusIndicatorProps {
  lastFetch: string | Date;
  staleThresholdMs?: number;
}

export function SourceStatusIndicator({
  lastFetch,
  staleThresholdMs = 1000 * 60 * 60 * 6, // 6 hours
}: SourceStatusIndicatorProps) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const checkStale = () => {
      const lastFetchTime = new Date(lastFetch).getTime();
      setIsStale(Date.now() - lastFetchTime > staleThresholdMs);
    };

    checkStale();
    // Re-check every minute
    const interval = setInterval(checkStale, 60000);
    return () => clearInterval(interval);
  }, [lastFetch, staleThresholdMs]);

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500",
        isStale ? "bg-red-500 animate-pulse" : "bg-emerald-500"
      )}
    />
  );
}
