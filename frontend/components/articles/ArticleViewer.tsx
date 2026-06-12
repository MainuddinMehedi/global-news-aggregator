"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import { useExtractedContent } from "@/hooks/useExtractedContent";

interface ArticleViewerProps {
  article: {
    url: string;
    source: string;
    contentSnippet: string;
    extractedContent: string | null;
  };
}

export default function ArticleViewer({ article }: ArticleViewerProps) {
  const [viewMode, setViewMode] = useState<
    "snippet" | "extracted" | "original"
  >("snippet");

  const { content, loading, error, source, extract, isCached } =
    useExtractedContent({
      url: article.url,
      enabled: false,
      initialContent: article.extractedContent,
    });

  const handleExtract = async () => {
    if (content) {
      setViewMode("extracted");
      return;
    }
    setViewMode("extracted");
    await extract();
  };

  const buttonLabel =
    loading && viewMode === "extracted"
      ? "Extracting..."
      : content
        ? "Full Article"
        : "Read Extracted Article";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border/50">
        <Button
          variant={viewMode === "snippet" ? "default" : "secondary"}
          onClick={() => setViewMode("snippet")}
          size="sm"
        >
          Summary
        </Button>
        <Button
          variant={viewMode === "extracted" ? "default" : "secondary"}
          onClick={handleExtract}
          size="sm"
          disabled={loading && viewMode === "extracted"}
          className="relative"
        >
          {buttonLabel}
          {isCached && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"
              title="Cached — no network request needed"
            />
          )}
        </Button>
        <Button
          variant={viewMode === "original" ? "default" : "secondary"}
          onClick={() => setViewMode("original")}
          size="sm"
        >
          View Original Website
        </Button>
      </div>

      <div className="min-h-[200px]">
        {viewMode === "snippet" && (
          <div className="article-prose max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.contentSnippet}
            </p>
          </div>
        )}

        {viewMode === "extracted" && (
          <div className="article-prose max-w-none">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-muted-foreground bg-destructive/5 rounded-xl border border-destructive/10">
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : content ? (
              <>
                {source && (
                  <p className="text-xs text-muted-foreground mb-4 not-prose">
                    Source:{" "}
                    <span className="font-medium capitalize">{source}</span>
                  </p>
                )}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </>
            ) : null}
          </div>
        )}

        {viewMode === "original" && (
          <div className="w-full h-[800px] rounded-xl overflow-hidden border border-border/50 bg-background relative">
            <iframe
              src={`/api/proxy?url=${encodeURIComponent(article.url)}`}
              className="w-full h-full border-0"
              title="Original Article"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )}
      </div>

      {viewMode !== "original" && (
        <div className="pt-6 border-t border-border/50">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
          >
            Read Full Article on {article.source}
            <HugeiconsIcon
              icon={LinkSquare01Icon}
              className="w-3.5 h-3.5 ml-2"
            />
          </a>
        </div>
      )}
    </div>
  );
}
