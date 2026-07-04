"use client";

import { ContentSkeleton } from "@/components/locked-topics/sources/ContentSkeleton";
import { readGoogleCache, writeGoogleCache } from "@/lib/locked-topics/api";
import { TopicFinding } from "@/types/lockedTopic";
import { useEffect, useState } from "react";

interface GoogleNewsContentProps {
  finding: TopicFinding;
}

export function GoogleNewsContent({ finding }: GoogleNewsContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [articleUrl, setArticleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try to load from cache on client side to avoid hydration mismatch
    const cached = readGoogleCache(finding.title);
    if (cached) {
      setContent(cached.content);
      setArticleUrl(cached.url);
      setLoading(false);
      return;
    }

    // 2. Fetch with AbortController for clean cancellation
    const controller = new AbortController();

    async function resolve() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/resolve-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: finding.title }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
          setArticleUrl(data.url || null);
          writeGoogleCache(finding.title, data.content, data.url || "");
        } else {
          setError("Could not fetch article. Open the original link to read.");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError("Could not fetch article. Open the original link to read.");
      } finally {
        setLoading(false);
      }
    }

    resolve();

    return () => {
      controller.abort();
    };
  }, [finding.title]);

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
                rel="noopener noreferrer"
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
