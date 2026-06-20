import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Back button link skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            {/* Category / Region Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-3/4 rounded-xl" />
            </div>

            {/* Metadata (Source, Date, etc) */}
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
          </div>

          {/* Article Viewer Shell Skeleton */}
          <div className="border border-border/40 rounded-2xl p-6 bg-card/20 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-40 rounded-md" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-5/6 rounded" />
              <Skeleton className="h-5 w-4/5 rounded" />
              <Skeleton className="h-5 w-3/4 rounded" />
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <Skeleton className="h-6 w-28 rounded" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>

            {/* Sentiment Block */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Bias Analysis Block */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>

            {/* Entities Block */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Profile Block */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
