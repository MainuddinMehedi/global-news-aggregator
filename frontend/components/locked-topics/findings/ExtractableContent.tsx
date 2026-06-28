"use client";

import { useState } from "react";
import { TopicFinding } from "@/types/lockedTopic";
import { useExtractedContent } from "@/hooks/useExtractedContent";
import { ContentSkeleton } from "@/components/locked-topics/sources/ContentSkeleton";

const loadingMessages: Record<string, string> = {
  ARTICLE: "Extracting article content...",
  RSS: "Extracting article content...",
  SCRAPE: "Extracting content...",
  WEBPAGE: "Extracting content...",
  COMPANY_CAREERS: "Extracting content...",
  REDDIT: "Loading Reddit post...",
  GITHUB: "Loading page...",
  SEARCH: "Extracting search result content...",
  YOUTUBE: "Loading YouTube video...",
};

const defaultMessage = "Loading content...";

interface ExtractableContentProps {
  finding: TopicFinding;
}

export function ExtractableContent({ finding }: ExtractableContentProps) {
  const [viewMode, setViewMode] = useState<"extracted" | "original">(
    "extracted",
  );

  const { content, loading, error, source, reExtract } = useExtractedContent({
    url: finding.sourceUrl,
    enabled: true,
  });

  const message = loadingMessages[finding.sourceType] || defaultMessage;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <button
          onClick={() => setViewMode("extracted")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            viewMode === "extracted"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          Extracted Content
        </button>
        <button
          onClick={() => setViewMode("original")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            viewMode === "original"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          View Original
        </button>
        <div className="flex-1" />
        <button
          onClick={reExtract}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-primary underline transition-colors disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Re-extract"}
        </button>
      </div>

      <div className="min-h-[200px]">
        {viewMode === "extracted" && (
          <>
            {loading && <ContentSkeleton message={message} />}
            {error && (
              <div className="p-8 text-center text-muted-foreground bg-destructive/5 rounded-xl border border-destructive/10">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            {!loading && !error && content && (
              <div className="article-prose max-w-none">
                {source && (
                  <p className="text-xs text-muted-foreground mb-4 not-prose">
                    Source:{" "}
                    <span className="font-medium capitalize">{source}</span>
                  </p>
                )}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            )}
          </>
        )}

        {viewMode === "original" && (
          <div className="w-full h-[600px] rounded-xl overflow-hidden border border-border/50 bg-background relative">
            <iframe
              src={`/api/proxy?url=${encodeURIComponent(finding.sourceUrl)}`}
              className="w-full h-full border-0"
              title="Original content"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
}
