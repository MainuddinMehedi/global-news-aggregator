"use client";

import { TopicFinding } from "@/types/lockedTopic";
import { isYouTubeUrl } from "@/lib/locked-topics";
import { GoogleNewsContent } from "./GoogleNewsContent";
import { RedditContent } from "./RedditContent";
import { YouTubeContent } from "./YouTubeContent";
import { ExtractableContent } from "./ExtractableContent";

interface FindingContentSectionProps {
  finding: TopicFinding;
}

export default function FindingContentSection({
  finding,
}: FindingContentSectionProps) {
  if (finding.sourceType === "YOUTUBE" || isYouTubeUrl(finding.sourceUrl)) {
    return <YouTubeContent finding={finding} />;
  }

  if (finding.sourceType === "GOOGLE") {
    return <GoogleNewsContent finding={finding} />;
  }

  if (finding.sourceType === "REDDIT") {
    return <RedditContent finding={finding} />;
  }

  return <ExtractableContent finding={finding} />;
}
