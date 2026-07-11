import { METADATA_COLORS } from "@/utils/colors";

export function getEventRegionBadgeVariant(
  eventRegion: string | null | undefined,
): "emerald" | "amber" | "blue" | "red" | "purple" | "fuchsia" | "neutral" {
  if (!eventRegion) return "neutral";
  const lower = eventRegion.toLowerCase();

  if (lower.includes("north america")) return "blue";
  if (lower.includes("europe")) return "emerald";
  if (lower.includes("middle east")) return "red";
  if (lower.includes("asia-pacific")) return "amber";
  if (lower.includes("south america")) return "purple";
  if (lower.includes("africa")) return "fuchsia";

  return "neutral";
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
  if (score == null)
    return { label: "No data", color: METADATA_COLORS.sentiment.neutral };
  if (score > 0.2)
    return { label: "Positive", color: METADATA_COLORS.sentiment.positive };
  if (score < -0.2)
    return { label: "Negative", color: METADATA_COLORS.sentiment.negative };

  return { label: "Neutral", color: METADATA_COLORS.sentiment.neutral };
}

export function getStartDate(timeRange: string): Date {
  let startDate = new Date(0);

  if (timeRange === "24h") {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (timeRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  return startDate;
}

export function calculateDistribution(
  counts: Record<string, number>,
  totalItems: number,
) {
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
