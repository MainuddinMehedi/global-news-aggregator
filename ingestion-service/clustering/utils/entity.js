import { cleanString } from "./clean.js";
import { ENTITY_ALIASES, ENTITY_TITLE_PREFIXES } from "./constants.js";

export function normalizeEntity(entity) {
  const original = cleanString(entity);
  if (!original) return undefined;

  let normalized = original
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  normalized = ENTITY_ALIASES.get(normalized) || normalized;

  for (const prefix of ENTITY_TITLE_PREFIXES) {
    if (normalized.startsWith(`${prefix} `)) {
      normalized = normalized.slice(prefix.length + 1).trim();
      break;
    }
  }

  normalized = normalized.replace(/\s+/g, " ").trim();
  return ENTITY_ALIASES.get(normalized) || normalized || undefined;
}

export function normalizedEntitySet(entities) {
  return new Set(
    (Array.isArray(entities) ? entities : [])
      .map(normalizeEntity)
      .filter(Boolean),
  );
}

export function normalizedStringSet(values) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => cleanString(value)?.toLowerCase())
      .filter(Boolean),
  );
}

export function tokenSet(value) {
  const text = cleanString(value);
  if (!text) return new Set();

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  );
}

export function intersectionSize(setA, setB) {
  let count = 0;
  for (const value of setA) {
    if (setB.has(value)) count += 1;
  }
  return count;
}
