import { Skeleton } from "@/components/ui/skeleton";

export default function StoryDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Back button link skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-28 rounded" />
      </div>

      {/* Story Hero Skeleton */}
      <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 sm:h-12 w-3/4 rounded-xl" />
        <div className="flex flex-wrap gap-4 pt-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8/12 width) */}
        <div className="lg:col-span-8 space-y-8">
          {/* AI Analysis Summary Card */}
          <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded" />
              <div className="h-[1px] bg-border/50 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-5/6 rounded" />
              <Skeleton className="h-5 w-4/5 rounded" />
            </div>

            {/* Why It Matters Callout */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 space-y-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-2/3 rounded" />
            </div>
          </div>

          {/* Perspective Widget Skeleton */}
          <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm space-y-6">
            <Skeleton className="h-5 w-44 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-11/12 rounded" />
              <Skeleton className="h-5 w-4/5 rounded" />
            </div>
          </div>

          {/* Multi-Source Perspectives List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <Skeleton className="h-8 w-52 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-5/6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Developments Timeline (4/12 width) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <div className="h-[1px] bg-border/50 w-full" />
            </div>
            
            {/* Timeline Steps Skeletons */}
            <div className="space-y-8 relative pl-4 border-l border-border/50 ml-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative space-y-2">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border border-2 border-background" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-5 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
