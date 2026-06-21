"use client";

import { useState, useEffect, useRef } from "react";
import { TopicFinding } from "@/types/lockedTopic";
import { readGoogleCache, writeGoogleCache } from "@/lib/locked-topics";
import { ContentSkeleton } from "./ContentSkeleton";

interface GoogleNewsContentProps {
  finding: TopicFinding;
}

export function GoogleNewsContent({ finding }: GoogleNewsContentProps) {
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
        if (!cancelled) {
          setError("Could not fetch article. Open the original link to read.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
