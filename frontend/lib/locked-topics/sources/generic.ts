import { USER_AGENT, ValidationResult } from "./shared";

// --- SERVER-SIDE VALIDATION ---

export async function validateGenericSource(
  url: string,
  type: string,
): Promise<ValidationResult> {
  const apiRes = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (!apiRes.ok) {
    return {
      valid: false,
      type,
      error: `URL returned status ${apiRes.status}.`,
    };
  }
  return { valid: true, type };
}
