import { Skeleton } from "@/components/ui/skeleton";

export default function StoriesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3 w-full max-w-2xl">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 sm:h-12 w-64" />
          <Skeleton className="h-12 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>

      {/* Grid Skeleton */}
      <div className="columns-1 sm:columns-2 gap-6 space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-2xl border border-border bg-card p-5"
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
    </div>
  );
}
