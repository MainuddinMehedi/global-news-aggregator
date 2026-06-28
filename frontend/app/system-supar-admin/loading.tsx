import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border pb-6">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-md rounded" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Navigation Skeleton */}
        <div className="w-full md:w-64 shrink-0 bg-card/45 border border-border/50 rounded-2xl p-4 space-y-4">
          <Skeleton className="h-4 w-20 rounded hidden md:block" />
          <div className="flex flex-row md:flex-col gap-2 md:space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 md:flex-none rounded-xl" />
            ))}
          </div>
        </div>

        {/* Content Area Skeleton (matching default Health tab) */}
        <div className="flex-1 w-full space-y-8">
          {/* Stats / Telemetry row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-border/40 rounded-2xl bg-card/30 p-5 space-y-3">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>

          {/* Active Workers & Ingestion Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border border-border/40 bg-card/20 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-4 w-32 rounded" />
              <div className="space-y-3 pt-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
            
            <div className="lg:col-span-2 border border-border/40 bg-card/20 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>

          {/* Task log table skeleton */}
          <div className="border border-border/40 bg-card/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center gap-4 py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-3.5 w-40 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
