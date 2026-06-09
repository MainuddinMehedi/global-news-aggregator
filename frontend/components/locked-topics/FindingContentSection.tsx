"use client";

import { useState, useEffect, useRef } from "react";
import { TopicFinding } from "@/types/lockedTopic";
import { useExtractedContent } from "@/hooks/useExtractedContent";

const loadingMessages: Record<string, string> = {
  ARTICLE: "Extracting article content...",
  RSS: "Extracting article content...",
  BRAVE: "Extracting article content...",
  SCRAPE: "Extracting content...",
  WEBPAGE: "Extracting content...",
  COMPANY_CAREERS: "Extracting content...",
  REDDIT: "Loading Reddit post...",
  GITHUB: "Loading page...",
};

const defaultMessage = "Loading content...";

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface FindingContentSectionProps {
  finding: TopicFinding;
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export default function FindingContentSection({
  finding,
}: FindingContentSectionProps) {
  if (isYouTubeUrl(finding.sourceUrl)) {
    return <YouTubeContent finding={finding} />;
  }

  if (finding.sourceType === "GOOGLE") {
    return <GoogleNewsContent finding={finding} />;
  }

  return <ExtractableContent finding={finding} />;
}

const GOOGLE_CACHE_PREFIX = "google-news:";
const GOOGLE_CACHE_TTL = 60 * 60 * 1000;

function getGoogleCacheKey(title: string): string {
  return GOOGLE_CACHE_PREFIX + title;
}

function readGoogleCache(title: string): { content: string; url: string } | null {
  try {
    const raw = localStorage.getItem(getGoogleCacheKey(title));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > GOOGLE_CACHE_TTL) {
      localStorage.removeItem(getGoogleCacheKey(title));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeGoogleCache(title: string, content: string, url: string): void {
  try {
    localStorage.setItem(
      getGoogleCacheKey(title),
      JSON.stringify({ content, url, ts: Date.now() }),
    );
  } catch {}
}

function GoogleNewsContent({ finding }: { finding: TopicFinding }) {
  const [content, setContent] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readGoogleCache(finding.title)?.content ?? null;
  });
  const [articleUrl, setArticleUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readGoogleCache(finding.title)?.url ?? null;
  });
  const [loading, setLoading] = useState(!content);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (content) return;

    mountedRef.current = true;

    let cancelled = false;

    async function resolve() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/resolve-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: finding.title }),
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setArticleUrl(data.url || null);
          writeGoogleCache(finding.title, data.content, data.url || "");
        } else {
          setError("Could not fetch article. Open the original link to read.");
        }
      } catch {
        if (!cancelled) setError("Could not fetch article. Open the original link to read.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [finding.title, content]);

  return (
    <div className="space-y-4">
      {loading && <ContentSkeleton message="Searching for article..." />}
      {error && (
        <div className="p-8 text-center">
          <div className="rounded-xl bg-muted/10 border border-dashed border-border/50 p-6 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      )}
      {content && (
        <>
          <div className="article-prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          {articleUrl && (
            <div className="border-t border-border/50 pt-3 text-center">
              <a
                href={articleUrl}
                target="_blank"
                className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
              >
                View original article
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function YouTubeContent({ finding }: { finding: TopicFinding }) {
  const videoId = getYouTubeVideoId(finding.sourceUrl);

  const { content, loading, error } = useExtractedContent({
    url: finding.sourceUrl,
    enabled: true,
  });

  return (
    <div className="space-y-4">
      {videoId ? (
        <div className="relative w-full aspect-video max-h-[300px] rounded-xl overflow-hidden bg-black">
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
            className="text-primary underline"
          >
            Open on YouTube
          </a>
        </div>
      )}

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

function ExtractableContent({ finding }: { finding: TopicFinding }) {
  const [viewMode, setViewMode] = useState<"extracted" | "original">(
    "extracted",
  );

  const { content, loading, error, source } = useExtractedContent({
    url: finding.sourceUrl,
    enabled: true,
  });

  const message =
    loadingMessages[finding.sourceType] || defaultMessage;

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

function ContentSkeleton({ message }: { message: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <p className="text-xs text-muted-foreground pt-4 text-center italic">
        {message}
      </p>
    </div>
  );
}
