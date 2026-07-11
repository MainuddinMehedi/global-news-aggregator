"use client";

import { ExtractableContent } from "@/components/locked-topics/findings/ExtractableContent";
import { GoogleNewsContent } from "@/components/locked-topics/sources/GoogleNewsContent";
import { RedditContent } from "@/components/locked-topics/sources/RedditContent";
import { YouTubeContent } from "@/components/locked-topics/sources/YouTubeContent";
import { isYouTubeUrl } from "@/lib/locked-topics/api";
import { TopicFinding } from "@/types/lockedTopic";

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
