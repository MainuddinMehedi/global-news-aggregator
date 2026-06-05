"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopicFinding, FindingSource } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface FindingsListProps {
  initialFindings: TopicFinding[];
  initialNextCursor: string | null;
  topicId: string;
  sourceType: FindingSource | "ALL";
  sort: "newest" | "oldest" | "relevance";
}

export default function FindingsList({
  initialFindings,
  initialNextCursor,
  topicId,
  sourceType,
  sort,
}: FindingsListProps) {
  const [findings, setFindings] = useState(initialFindings);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset list when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFindings(initialFindings);
    setCursor(initialNextCursor);
    setError(null);
  }, [initialFindings, initialNextCursor]);

  const fetchNextPage = useCallback(async () => {
    if (!cursor || isLoading || error) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        source: sourceType,
        sort,
        cursor,
      });
      const res = await fetch(
        `/api/locked-topics/${topicId}/findings?${params}`,
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const { findings: next, nextCursor } = await res.json();
      setFindings((prev) => [...prev, ...next]);
      setCursor(nextCursor);
    } catch (err) {
      console.error("Failed to load more findings:", err);
      setError("Failed to load more findings.");
    } finally {
      setLoading(false);
    }
  }, [cursor, isLoading, error, topicId, sourceType, sort]);

  // intersection observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, error]);

  const handleRetry = () => {
    setError(null);
    setTimeout(() => fetchNextPage(), 0);
  };

  if (findings.length === 0 && !isLoading) {
    return (
      <div className="py-24 text-center space-y-6 bg-secondary/5 rounded-[2rem] border border-dashed border-secondary/50">
        <p className="text-muted-foreground font-semibold text-lg leading-relaxed max-w-sm mx-auto tracking-tight">
          No matches found for your current filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>

      {!error && (
        <div ref={sentinelRef}>
          {isLoading && (
            <div className="space-y-4 pt-4">
              <FindingSkeleton />
              <FindingSkeleton />
            </div>
          )}
          {!cursor && !isLoading && findings.length > 0 && (
            <div className="flex items-center justify-center py-16 gap-6">
              <div className="h-px bg-border flex-1" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 whitespace-nowrap">
                Surveillance Complete
              </p>
              <div className="h-px bg-border flex-1" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-destructive/5 rounded-[2rem] border border-destructive/10">
          <p className="text-sm font-bold text-destructive mb-6 leading-relaxed">
            {error}
          </p>
          <Button
            onClick={handleRetry}
            className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/10"
          >
            <HugeiconsIcon icon={RefreshIcon} size={18} className="mr-2" />
            Retry Fetch
          </Button>
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding }: { finding: TopicFinding }) {
  return (
    <div className="p-8 rounded-2xl border border-secondary bg-secondary/10 hover:border-primary/40 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {finding.sourceType}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {finding.sourceName}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold group-hover:text-primary transition-colors leading-tight tracking-tight">
            <a href={finding.sourceUrl} target="_blank">
              {finding.title}
            </a>
          </h3>
          {finding.summary && (
            <p className="text-[15px] text-muted-foreground/90 line-clamp-3 leading-relaxed font-medium tracking-tight">
              {finding.summary}
            </p>
          )}
        </div>
        {finding.relevanceScore && (
          <div className="flex flex-col items-start md:items-end shrink-0 p-4 rounded-2xl bg-secondary/10 border border-secondary/20 md:min-w-[100px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
              Signal
            </span>
            <div className="text-3xl font-black text-primary font-mono leading-none tracking-tighter">
              {(finding.relevanceScore * 100).toFixed(0)}
              <span className="text-[10px] ml-0.5 opacity-50">%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingSkeleton() {
  return (
    <div className="p-6 rounded-[1.5rem] border border-secondary bg-background/50 space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-8 w-4/5 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}
