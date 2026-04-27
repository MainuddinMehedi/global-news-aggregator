import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a Date into relative time (e.g. "2h ago", "3d ago") */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Bias category → Tailwind classes for color-coded badges */
export const biasStyles: Record<string, { bg: string; text: string; border: string }> = {
  Western: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  Eastern: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
  "Non-Western": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  Neutral: {
    bg: "bg-zinc-700/30",
    text: "text-zinc-400",
    border: "border-zinc-600",
  },
};

/** Get sentiment label and color from score */
export function getSentimentInfo(score: number | null | undefined) {
  if (score == null) return { label: "N/A", color: "text-zinc-500", bgColor: "bg-zinc-800" };
  if (score > 0.2) return { label: "Positive", color: "text-emerald-400", bgColor: "bg-emerald-500/10" };
  if (score < -0.2) return { label: "Negative", color: "text-rose-400", bgColor: "bg-rose-500/10" };
  return { label: "Neutral", color: "text-zinc-400", bgColor: "bg-zinc-800" };
}

/** Article type shared across components */
export interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  contentSnippet: string;
  biasNote: string | null;
  biasCategory: string | null;
  sentimentScore: number | null;
  perspectiveCountries: string[];
  url: string;
  categories: { id: string; name: string }[];
  entities: string[];
  sourceCountry: string | null;
}
