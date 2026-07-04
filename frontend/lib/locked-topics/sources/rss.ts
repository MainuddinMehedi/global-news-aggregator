import { USER_AGENT, ValidationResult } from "./shared";

// --- SERVER-SIDE VALIDATION ---

export async function validateRssSource(
  url: string,
  type: string,
): Promise<ValidationResult> {
  const apiRes = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (!apiRes.ok) {
    return {
      valid: false,
      type,
      error: `RSS URL returned status ${apiRes.status}.`,
    };
  }

  const text = await apiRes.text();
  const cleanText = text.trim();
  const isXml =
    cleanText.startsWith("<") &&
    (cleanText.includes("<rss") ||
      cleanText.includes("<feed") ||
      cleanText.includes("<channel") ||
      cleanText.includes("<xml"));

  if (!isXml) {
    return {
      valid: false,
      type,
      error: "URL is reachable but does not return valid RSS/Atom XML.",
    };
  }
  return { valid: true, type };
}
