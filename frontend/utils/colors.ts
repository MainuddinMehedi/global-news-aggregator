export const METADATA_COLORS = {
  sentiment: {
    positive: "#10b981", // Emerald
    negative: "#ef4444", // Red
    neutral: "#6b7280",  // Gray
  },
  impact: {
    CRITICAL: "#ef4444", // Red
    HIGH: "#f59e0b",     // Orange
    MEDIUM: "#3b82f6",   // Blue
    LOW: "#10b981",      // Emerald
  },
  region: {
    "North America": "#3b82f6",  // Blue
    Europe: "#10b981",           // Emerald
    "Middle East": "#ef4444",    // Red
    "Asia-Pacific": "#f59e0b",   // Orange
    "South America": "#8b5cf6",  // Purple
    Africa: "#d946ef",           // Fuchsia
    Global: "#6b7280",           // Gray
  },
  bias: {
    Centrist: "#10b981",          // Emerald
    "Left-leaning": "#3b82f6",    // Blue
    "Right-leaning": "#ef4444",   // Red
    "State-Aligned": "#f59e0b",   // Orange
    "State-Controlled": "#8b5cf6", // Purple
  },
  scope: {
    Global: "#10b981",   // Emerald
    Regional: "#3b82f6", // Blue
    National: "#f59e0b", // Orange
  },
};

/**
 * Fallback color for unknowns
 */
export const DEFAULT_CHART_COLOR = "#9ca3af";
