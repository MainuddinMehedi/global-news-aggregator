import { SourceConfig } from "@/types/lockedTopic";

export function detectSourceType(url: string): SourceConfig["type"] {
  if (!url) return "webpage";

  const lowerUrl = url.toLowerCase();

  // 1. Feed file extensions — strongest signal
  if (
    lowerUrl.endsWith(".rss") ||
    lowerUrl.endsWith(".xml") ||
    lowerUrl.endsWith(".atom")
  ) {
    return "rss";
  }

  // 2. Feed path indicators
  if (/\/(feed|rss|atom|feeds)(\/|$|\.|\?)/.test(lowerUrl)) {
    return "rss";
  }

  // 3. Feed query parameters
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    if (
      params.has("feed") ||
      params.get("format") === "rss" ||
      params.get("alt") === "rss"
    ) {
      return "rss";
    }
  } catch {}

  // 4. Feedburner
  if (lowerUrl.includes("feeds.feedburner.com")) {
    return "rss";
  }

  // 5. Platform-specific URLs
  if (
    lowerUrl.includes("reddit.com/r/") ||
    lowerUrl.includes("reddit.com/u/") ||
    lowerUrl.includes("reddit.com/user/")
  ) {
    return "reddit";
  }

  if (lowerUrl.includes("github.com/")) {
    return "github";
  }

  if (
    lowerUrl.includes("youtube.com/channel/") ||
    lowerUrl.includes("youtube.com/@")
  ) {
    return "youtube";
  }

  if (
    lowerUrl.includes("boards.greenhouse.io") ||
    lowerUrl.includes("jobs.lever.co")
  ) {
    return "company_careers";
  }

  return "webpage";
}

export function generateSourceLabel(url: string, type: SourceConfig["type"]): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname.replace("www.", "");

    switch (type) {
      case "rss": {
        return `${hostname} RSS`;
      }
      case "reddit": {
        const match = url.match(/reddit\.com\/r\/([^/?#]+)/i);
        if (match) {
          return `r/${match[1]} Reddit`;
        }
        return `${hostname} Reddit`;
      }
      case "github": {
        const parts = parsed.pathname.replace(/^\//, "").split("/");
        if (parts.length >= 2) {
          return `${parts[0]}/${parts[1]} GitHub`;
        }
        return `${hostname} GitHub`;
      }
      case "youtube": {
        const channelMatch = url.match(/youtube\.com\/@([^/?#]+)/i);
        if (channelMatch) {
          return `${capitalize(channelMatch[1].replace(/[-_]/g, " "))} YouTube`;
        }
        const channelIdMatch = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
        if (channelIdMatch) {
          return `Channel ${channelIdMatch[1].slice(0, 8)} YouTube`;
        }
        return "YouTube";
      }
      case "company_careers": {
        const pathSegment = parsed.pathname.replace(/^\//, "").split("/")[0];
        if (pathSegment && pathSegment !== "boards" && pathSegment !== "jobs") {
          return `${capitalize(pathSegment.replace(/[-_]/g, " "))} Careers`;
        }
        return `${hostname.replace(/\..+$/, "")} Careers`;
      }
      default:
        return hostname;
    }
  } catch {
    return type.replace("_", " ");
  }
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
