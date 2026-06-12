export type HomePageMode = "continuous" | "daily" | "hourly";

/**
 * Returns a strict grouping key for an article's date based on the mode.
 * - daily: "YYYY-MM-DD"
 * - hourly (shift): "YYYY-MM-DD-ShiftIndex" (0 to 5)
 */
export function getGroupingKey(dateString: string, mode: HomePageMode): string {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  if (mode === "daily" || mode === "continuous") {
    return dateKey;
  }

  if (mode === "hourly") {
    // 4-hour shifts
    const hour = d.getHours();
    const shiftIndex = Math.floor(hour / 4);
    return `${dateKey}-${shiftIndex}`;
  }

  return dateKey;
}

/**
 * Converts a grouping key into a human-readable title.
 * e.g., "Today", "Yesterday", "June 10", "Today, 8:00 AM - 12:00 PM"
 */
export function formatGroupingKey(key: string, mode: HomePageMode): string {
  if (!key) return "Older News";

  const parts = key.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let datePrefix = "";
  if (date.toDateString() === today.toDateString()) {
    datePrefix = "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    datePrefix = "Yesterday";
  } else {
    // e.g., "June 10" or "June 10, 2025"
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    if (year !== today.getFullYear()) {
      options.year = "numeric";
    }
    datePrefix = date.toLocaleDateString("en-US", options);
  }

  if (mode === "daily" || mode === "continuous") {
    return datePrefix;
  }

  if (mode === "hourly") {
    const shiftIndex = parseInt(parts[3], 10);
    const shiftNames = [
      "12:00 AM - 4:00 AM",
      "4:00 AM - 8:00 AM",
      "8:00 AM - 12:00 PM",
      "12:00 PM - 4:00 PM",
      "4:00 PM - 8:00 PM",
      "8:00 PM - 12:00 AM"
    ];
    const shiftSuffix = shiftNames[shiftIndex] || "";
    return `${datePrefix}, ${shiftSuffix}`;
  }

  return datePrefix;
}
