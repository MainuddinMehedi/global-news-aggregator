"use client";

import { ContentSkeleton } from "@/components/locked-topics/sources/ContentSkeleton";
import { useExtractedContent } from "@/hooks/useExtractedContent";
import { getYouTubeVideoId } from "@/lib/locked-topics/api";
import { TopicFinding } from "@/types/lockedTopic";

interface YouTubeContentProps {
  finding: TopicFinding;
}

export function YouTubeContent({ finding }: YouTubeContentProps) {
  const videoId = getYouTubeVideoId(finding.sourceUrl);

  const { content, loading, error, reExtract } = useExtractedContent({
    url: finding.sourceUrl,
    enabled: true,
  });

  return (
    <div className="space-y-4">
      {videoId ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={finding.title}
          />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
          Could not embed video.{" "}
          <a
            href={finding.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Open on YouTube
          </a>
        </div>
      )}

      <div className="flex justify-end border-b border-border/50 pb-2">
        <button
          onClick={reExtract}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-primary underline transition-colors disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Re-extract description"}
        </button>
      </div>

      {loading ? (
        <ContentSkeleton message="Loading description..." />
      ) : error ? (
        <p className="text-sm text-muted-foreground italic">
          No description available.
        </p>
      ) : content ? (
        <div className="article-prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      ) : null}
    </div>
  );
}
