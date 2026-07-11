import { Skeleton } from "@/components/ui/skeleton";

export function StoriesGridSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 gap-6 space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-6" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
