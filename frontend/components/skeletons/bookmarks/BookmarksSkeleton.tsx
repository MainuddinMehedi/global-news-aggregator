import { ArticleCardSkeleton } from "@/components/skeletons/home/ArticleCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function BookmarksSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Tabs list row */}
      <div className="mb-6 bg-muted/20 border border-border/40 rounded-xl p-1 flex gap-2 w-max">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Articles Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
