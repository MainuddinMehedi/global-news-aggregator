import { createHash } from 'crypto';

export default function hashSnippet(text) {
  if (!text) return null;

  const clean = text.replace(/\s+/g, " ").trim().toLowerCase();
  return createHash("sha256").update(clean).digest("hex");
}
