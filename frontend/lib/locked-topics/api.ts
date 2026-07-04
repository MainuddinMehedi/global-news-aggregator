/**
 * Helper to extract YouTube video ID from various YouTube URL formats.
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Checks if a URL is a YouTube link.
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

/**
 * Heuristically formats plain text snippet content into HTML paragraph and heading structures.
 */
export function autoFormatPlainText(title: string, text: string): string {
  if (!text) return "";
  
  // Clean duplicate title prefix
  let cleanText = text.trim();
  const titleLower = title.toLowerCase().trim();
  if (cleanText.toLowerCase().startsWith(titleLower)) {
    cleanText = cleanText.slice(title.length).trim().replace(/^[:\-\s\n]+/, "");
  }
  
  // If the text already has newlines, convert them to HTML paragraphs
  if (cleanText.includes("\n")) {
    return cleanText
      .split(/\n\n+/)
      .map((para, i) => `<p key="${i}">${para.replace(/\n/g, '<br/>')}</p>`)
      .join("");
  }
  
  // Heuristic sentence-to-paragraph and heading splitter for legacy flat text
  const sentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
  if (sentences.length <= 3) {
    return `<p>${cleanText}</p>`;
  }
  
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // Header heuristic: short, Title Case, no ending period
    const words = trimmed.split(/\s+/);
    const isTitleCase = words.length > 1 && words.every(w => {
      return /^[A-Z]/.test(w) || /^(and|or|of|in|on|at|with|without|a|an|the|to|for|is|are|vs)$/i.test(w);
    });
    const isHeader = trimmed.length < 60 && !trimmed.endsWith(".") && isTitleCase;
    
    if (isHeader) {
      if (currentParagraph.length > 0) {
        paragraphs.push(`<p>${currentParagraph.join(" ")}</p>`);
        currentParagraph = [];
      }
      paragraphs.push(`<h2>${trimmed}</h2>`);
    } else {
      currentParagraph.push(trimmed);
      if (currentParagraph.length >= 3) {
        paragraphs.push(`<p>${currentParagraph.join(" ")}</p>`);
        currentParagraph = [];
      }
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(`<p>${currentParagraph.join(" ")}</p>`);
  }
  
  return paragraphs.join("");
}

const GOOGLE_CACHE_PREFIX = "google-news:";
const GOOGLE_CACHE_TTL = 60 * 60 * 1000;

/**
 * Reads Google News cache entries from LocalStorage.
 */
export function readGoogleCache(
  title: string,
): { content: string; url: string } | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(GOOGLE_CACHE_PREFIX + title);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > GOOGLE_CACHE_TTL) {
      localStorage.removeItem(GOOGLE_CACHE_PREFIX + title);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

/**
 * Writes Google News cache entries to LocalStorage.
 */
export function writeGoogleCache(title: string, content: string, url: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      GOOGLE_CACHE_PREFIX + title,
      JSON.stringify({ content, url, ts: Date.now() }),
    );
  } catch {}
}
