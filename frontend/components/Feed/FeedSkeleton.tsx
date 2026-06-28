import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      {/* Title + AI button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
      </div>

      {/* Source · time · sentiment */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Content snippet */}
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>

      {/* Category tags */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      {/* Footer divider */}
      <div className="border-t border-border/50 pt-3">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="space-y-3">
      {/* Category pill row */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16 shrink-0 rounded-md" />
        ))}
      </div>

      {/* Sort select + article count */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
    </div>
  );
}

export default function FeedSkeleton() {
  return (
    <div className="flex flex-1 w-full">
      <div className="flex-1 min-w-0 p-5 space-y-5">
        <FiltersSkeleton />
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-5">
              <ArticleCardSkeleton />
            </div>
          ))}
        </div>
      </div>

      {/* Information Widgets Skeleton — only on xl+ */}
      <div className="hidden xl:flex xl:w-72 shrink-0 p-4 pl-1">
        <aside className="flex flex-col space-y-4 w-full">
          {/* SourceOriginWidget Skeleton */}
          <div className="rounded-2xl border border-border/40 bg-card/20 p-5 space-y-3">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-[120px] w-full rounded-xl" />
          </div>

          {/* EventClustersWidget Skeleton */}
          <div className="rounded-2xl border border-border/40 bg-card/20 p-5 space-y-3">
            <Skeleton className="h-3.5 w-36 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* DiversityInsightWidget Skeleton */}
          <div className="rounded-2xl border border-border/40 bg-card/20 p-5 space-y-3">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
