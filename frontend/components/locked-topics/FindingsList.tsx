"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopicFinding, FindingSource } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { FindingDetailsModal } from "./FindingDetailsModal";
import { FindingCard } from "./FindingCard";
import { FindingSkeleton } from "./FindingSkeleton";

interface FindingsListProps {
  initialFindings: TopicFinding[];
  initialNextCursor: string | null;
  topicId: string;
  sourceType: FindingSource | "ALL" | "OTHER";
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
  const [selectedFinding, setSelectedFinding] = useState<TopicFinding | null>(
    null,
  );
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

  const handleDeleteFinding = useCallback(
    async (findingId: string) => {
      // Optimistic UI update: remove from state immediately
      setFindings((prev) => prev.filter((f) => f.id !== findingId));

      try {
        const res = await fetch(
          `/api/locked-topics/${topicId}/findings/${findingId}`,
          {
            method: "DELETE",
          },
        );
        if (!res.ok) {
          throw new Error("Failed to delete from database");
        }
      } catch (err) {
        console.error("Error deleting finding:", err);
      }
    },
    [topicId],
  );

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
          <FindingCard
            key={finding.id}
            finding={finding}
            onSelect={setSelectedFinding}
            onDelete={handleDeleteFinding}
          />
        ))}
      </div>

      {selectedFinding && (
        <FindingDetailsModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onDelete={async () => {
            const idToDelete = selectedFinding.id;
            setSelectedFinding(null);
            await handleDeleteFinding(idToDelete);
          }}
        />
      )}

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
