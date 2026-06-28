import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCardSkeleton } from "@/components/Feed/FeedSkeleton";

export default function BookmarksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Title */}
      <Skeleton className="h-9 w-40 mb-8 rounded-lg" />

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
