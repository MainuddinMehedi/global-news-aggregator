import { FindingSkeleton } from "@/components/locked-topics/findings/FindingSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FindingsSectionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Filter Tabs Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Findings Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <FindingSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
