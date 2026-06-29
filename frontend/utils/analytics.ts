export function getEventRegionBadgeVariant(
  eventRegion: string | null | undefined,
): "emerald" | "amber" | "blue" | "red" | "neutral" {
  if (!eventRegion) return "neutral";
  const lower = eventRegion.toLowerCase();

  if (lower.includes("north america")) return "blue";
  if (lower.includes("europe")) return "emerald";
  if (lower.includes("middle east")) return "red";
  if (lower.includes("asia-pacific")) return "amber";
  if (lower.includes("south america")) return "emerald";
  if (lower.includes("africa")) return "amber";
  if (lower.includes("global")) return "neutral";

  return "neutral";
}

export const COUNTRY_TO_REGION: Record<string, string> = {
  Bangladesh: "Asia-Pacific",
  India: "Asia-Pacific",
  China: "Asia-Pacific",
  Japan: "Asia-Pacific",
  USA: "North America",
  Canada: "North America",
  UK: "Europe",
  France: "Europe",
  Germany: "Europe",
  Russia: "Europe",
  Qatar: "Middle East",
  "Saudi Arabia": "Middle East",
  Israel: "Middle East",
  Egypt: "Middle East",
  Global: "Global",
};

export function getPublisherRegion(country: string | null | undefined): string {
  if (!country || country.trim() === "" || country === "Global") {
    return "Global";
  }

  return COUNTRY_TO_REGION[country] || "Global";
}

/**
 * Converts large metrics (like Corpus Size on the Analytics dashboard) into a compact shorthand (e.g., 1500 -> 1.5K)
 */
export function formatCompactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Maps a numeric sentiment score (-1 to 1) to a human-readable label and UI color.
 */
export function getSentimentDisplayProps(score: number | null | undefined): {
  label: string;
  color: string;
} {
  if (score == null) return { label: "No data", color: "#6b7280" }; // Gray
  if (score > 0.2) return { label: "Positive", color: "#10b981" }; // Green
  if (score < -0.2) return { label: "Negative", color: "#ef4444" }; // Red

  return { label: "Neutral", color: "#f59e0b" }; // Yellow
}
