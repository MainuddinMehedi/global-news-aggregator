import { USER_AGENT, ValidationResult } from "./shared";

// --- SERVER-SIDE VALIDATION ---

export async function validateCareersSource(
  url: string,
  type: string,
): Promise<ValidationResult> {
  const lowerUrl = url.toLowerCase();
  let slug = "";
  let isGreenhouse = false;
  let isLever = false;

  if (lowerUrl.includes("greenhouse.io")) {
    isGreenhouse = true;
    slug = url
      .split("/boards/")[1]
      ?.split("/")[0]
      ?.replace(/[^a-z0-9]/g, "")
      .trim();
  } else if (lowerUrl.includes("lever.co")) {
    isLever = true;
    slug = url
      .split("/jobs/")[1]
      ?.split("/")[0]
      ?.replace(/[^a-z0-9]/g, "")
      .trim();
  }

  if (!slug) {
    return {
      valid: false,
      type,
      error: "Could not parse company name from ATS URL.",
    };
  }

  if (isGreenhouse) {
    const apiRes = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!apiRes.ok) {
      return {
        valid: false,
        type,
        error: `Greenhouse job board for "${slug}" does not exist.`,
      };
    }
  } else if (isLever) {
    const apiRes = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!apiRes.ok) {
      return {
        valid: false,
        type,
        error: `Lever job board for "${slug}" does not exist.`,
      };
    }
  }
  return { valid: true, type };
}
