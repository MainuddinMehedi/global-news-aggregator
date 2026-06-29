import { Skeleton } from "@/components/ui/skeleton";
import { FindingSkeleton } from "@/components/locked-topics/findings/FindingSkeleton";

export default function TopicDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-10 sm:h-12 w-64 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
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
