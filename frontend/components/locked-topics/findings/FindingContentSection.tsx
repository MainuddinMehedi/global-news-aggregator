"use client";

import { TopicFinding } from "@/types/lockedTopic";
import { isYouTubeUrl } from "@/lib/locked-topics";
import { GoogleNewsContent } from "@/components/locked-topics/sources/GoogleNewsContent";
import { RedditContent } from "@/components/locked-topics/sources/RedditContent";
import { YouTubeContent } from "@/components/locked-topics/sources/YouTubeContent";
import { ExtractableContent } from "@/components/locked-topics/findings/ExtractableContent";

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
