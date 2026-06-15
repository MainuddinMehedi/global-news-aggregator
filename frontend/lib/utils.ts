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

export function getEventRegionBadgeVariant(
  eventRegion: string | null | undefined,
): "emerald" | "amber" | "blue" | "red" | "neutral" {
  if (!eventRegion) return "neutral";
  const lower = eventRegion.toLowerCase();

  if (lower.includes("north america")) return "blue";
  if (lower.includes("europe")) return "emerald";
  if (lower.includes("middle east")) return "red";
  if (lower.includes("asia-pacific")) return "amber";
  if (lower.includes("latin america")) return "emerald";
  if (lower.includes("africa")) return "amber";
  if (lower.includes("global")) return "neutral";

  return "neutral";
}

export const COUNTRY_TO_REGION: Record<string, string> = {
  "Bangladesh": "Asia-Pacific",
  "India": "Asia-Pacific",
  "China": "Asia-Pacific",
  "Japan": "Asia-Pacific",
  "USA": "North America",
  "Canada": "North America",
  "UK": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Russia": "Europe",
  "Qatar": "Middle East",
  "Saudi Arabia": "Middle East",
  "Israel": "Middle East",
  "Egypt": "Middle East",
  "Global": "Global",
};

export function getPublisherRegion(country: string | null | undefined): string {
  if (!country || country.trim() === "" || country === "Global") {
    return "Global";
  }
  return COUNTRY_TO_REGION[country] || "Global";
}
