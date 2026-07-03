import { ArticleCardSkeleton } from "./ArticleCardSkeleton";

export function ArticleFeedSkeleton() {
  return (
    <div className="space-y-0 pb-10">
      {Array.from({ length: 5 }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticleFeedLoadingGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-5">
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
      <ArticleCardSkeleton />
    </div>
  );
}
