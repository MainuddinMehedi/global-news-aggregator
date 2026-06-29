"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/utils/formatters";

interface RelativeTimeProps {
  date: string | Date | null | undefined;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    // Formatting on mount to avoid hydration mismatch
    const dateStr = typeof date === "string" ? date : date.toISOString();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormatted(formatRelativeTime(dateStr));

    // Optional: Update every minute
    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(dateStr));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  // Initial render (SSR/SSG) can show a fallback or nothing to avoid mismatch
  // but if we want something to show up in the first paint, we might accept a small mismatch
  // or just show the absolute date.
  if (!formatted) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formatted}</span>;
}
