import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function getBiasBadgeVariant(
  biasCategory: string | null | undefined,
): "emerald" | "amber" | "blue" | "red" | "neutral" {
  if (!biasCategory) return "neutral";
  const lower = biasCategory.toLowerCase();

  // Perspective mapping (based on PerspectiveWidget colors)
  if (lower.includes("non-western")) return "emerald";
  if (lower.includes("western")) return "blue";
  if (lower.includes("eastern")) return "red";
  if (lower.includes("wire")) return "amber";

  // Standard bias mapping
  if (lower.includes("left")) return "blue";
  if (lower.includes("right")) return "red";
  if (lower.includes("center") || lower.includes("least")) return "emerald";
  if (lower.includes("mixed")) return "amber";

  return "neutral";
}
