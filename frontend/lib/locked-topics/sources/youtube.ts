import { detectSourceType } from "../sourceDetection";

// --- CLIENT-SIDE VALIDATION ---

export function getYoutubeUrlError(input: string): string | null {
  if (!input) return null;

  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    try {
      new URL(part);
      if (detectSourceType(part) !== "youtube") {
        return `"${part}" is not a valid YouTube URL.`;
      }
    } catch {
      // Not a URL, so it's a name. Names are allowed.
    }
  }
  return null;
}
