export function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function cleanStringArray(value, limit = 12) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = [
    ...new Set(
      value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];

  return cleaned.slice(0, limit);
}

export function getCategoryNames(categories) {
  if (!Array.isArray(categories)) return [];

  return categories
    .map((category) =>
      typeof category === "string" ? category : cleanString(category?.name),
    )
    .filter(Boolean);
}
