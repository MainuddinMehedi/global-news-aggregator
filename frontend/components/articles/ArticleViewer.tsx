"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";

interface ArticleViewerProps {
  article: {
    url: string;
    source: string;
    contentSnippet: string;
    // Pre-fetched content from DB (null if not yet extracted for this article)
    extractedContent: string | null;
  };
}

export default function ArticleViewer({ article }: ArticleViewerProps) {
  const [viewMode, setViewMode] = useState<
    "snippet" | "extracted" | "original"
  >("snippet");
  // Seed state with DB content if available — no network call needed on first click
  const [extractedContent, setExtractedContent] = useState<string | null>(
    article.extractedContent,
  );
  const [loading, setLoading] = useState(false);
  const [extractSource, setExtractSource] = useState<string>(
    article.extractedContent ? "database" : "",
  );

  const handleExtract = async () => {
    // Already have content in state (from DB or a previous fetch) — just switch view
    if (extractedContent) {
      setViewMode("extracted");
      return;
    }

    setLoading(true);
    setViewMode("extracted");
    try {
      const res = await fetch(
        `/api/extract?url=${encodeURIComponent(article.url)}`,
      );
      if (!res.ok) throw new Error("Failed to extract");
      const data = await res.json();
      setExtractedContent(data.content);
      setExtractSource(data.source);
    } catch (err) {
      console.error(err);
      setExtractedContent(
        "<p class='text-red-500'>Failed to extract article content. Please read the original article.</p>",
      );
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel =
    loading && viewMode === "extracted"
      ? "Extracting..."
      : extractedContent
        ? "Full Article"
        : "Read Extracted Article";

  return (
    <div className="space-y-6">
      {/* Buttons: Summary | Read extracted article | View original */}
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
          {/* Green dot indicator: content is already cached in DB */}
          {article.extractedContent && (
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
        {/* Summary */}
        {viewMode === "snippet" && (
          <div className="article-prose max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.contentSnippet}
            </p>
          </div>
        )}

        {/* Extracted article */}
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
            ) : extractedContent ? (
              <>
                {extractSource && (
                  <p className="text-xs text-muted-foreground mb-4 not-prose">
                    Source:{" "}
                    <span className="font-medium capitalize">{extractSource}</span>
                  </p>
                )}
                <div dangerouslySetInnerHTML={{ __html: extractedContent }} />
              </>
            ) : null}
          </div>
        )}

        {/* Embedding */}
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

      {/* Link to original website */}
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
