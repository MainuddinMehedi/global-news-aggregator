import { FindingSource, SourceConfig } from "@/types/lockedTopic";

export function detectSourceType(url: string): SourceConfig["type"] {
  if (!url) return "webpage";

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('reddit.com/r/') || lowerUrl.includes('reddit.com/u/') || lowerUrl.includes('reddit.com/user/')) {
    return 'reddit';
  }

  if (lowerUrl.includes('github.com/')) {
    return 'github';
  }

  if (lowerUrl.includes('youtube.com/channel/') || lowerUrl.includes('youtube.com/@')) {
    return 'youtube';
  }

  if (lowerUrl.includes('boards.greenhouse.io') || lowerUrl.includes('jobs.lever.co')) {
    return 'company_careers';
  }

  if (lowerUrl.endsWith('.rss') || lowerUrl.endsWith('.xml') || lowerUrl.includes('/feed') || lowerUrl.includes('/rss')) {
    return 'rss';
  }

  // Default fallback for any other URL
  return 'webpage';
}
