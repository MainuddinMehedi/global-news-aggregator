"use client";

import { FindingCard } from "@/components/locked-topics/findings/FindingCard";
import { FindingDetailsModal } from "@/components/locked-topics/findings/FindingDetailsModal";
import { FindingSkeleton } from "@/components/locked-topics/findings/FindingSkeleton";
import { Button } from "@/components/ui/button";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { FindingSource, TopicFinding } from "@/types/lockedTopic";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";

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
  const [selectedFinding, setSelectedFinding] = useState<TopicFinding | null>(
    null,
  );

  const {
    items: findings,
    setItems: setFindings,
    isLoading,
    error,
    cursor,
    sentinelRef,
    handleRetry,
  } = useInfiniteScroll<TopicFinding>({
    endpoint: `/api/locked-topics/${topicId}/findings`,
    queryParams: { source: sourceType, sort },
    initialItems: initialFindings,
    initialCursor: initialNextCursor,
    dataKey: "findings",
    fetchDependencies: [topicId, sourceType, sort],
  });

  const handleDeleteFinding = useCallback(
    async (findingId: string) => {
      // Optimistic UI update: remove from state immediately
      setFindings((prev) => prev.filter((f) => f.id !== findingId));
      if (selectedFinding?.id === findingId) {
        setSelectedFinding(null);
      }

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
    [topicId, selectedFinding, setFindings],
  );

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
            onDelete={handleDeleteFinding}
            onSelect={setSelectedFinding}
          />
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

      <FindingDetailsModal
        finding={selectedFinding}
        open={!!selectedFinding}
        onOpenChange={(open) => {
          if (!open) setSelectedFinding(null);
        }}
        onDelete={async () => {
          if (selectedFinding) {
            await handleDeleteFinding(selectedFinding.id);
            setSelectedFinding(null);
          }
        }}
      />
    </div>
  );
}
