import { cleanString } from "./clean.js";

export function cleanKeyDevelopments(value, limit = 10) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const title = cleanString(item.title);
      if (!title) return null;

      const development = { title };
      const date = cleanString(item.date);
      const description = cleanString(item.description);

      if (date) development.date = date;
      if (description) development.description = description;

      return development;
    })
    .filter(Boolean);

  return cleaned.slice(0, limit);
}

export function mergeStringArrays(existing, incoming, limit = 12) {
  return [
    ...new Set([...(existing || []), ...(incoming || [])].filter(Boolean)),
  ].slice(0, limit);
}

export function mergeKeyDevelopments(existing, incoming, limit = 10) {
  const merged = [];
  const seen = new Set();

  for (const development of [
    ...(cleanKeyDevelopments(existing, limit) || []),
    ...(incoming || []),
  ]) {
    const key = `${development.title}|${development.date || ""}`.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    merged.push(development);
  }

  return merged.slice(-limit);
}
