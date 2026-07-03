"use client";

import ArticleCard from "@/components/articles/ArticleCard";
import { PaginationError } from "@/components/Feed/PaginationError";
import { ArticleFeedLoadingGrid } from "@/components/skeletons/home/ArticleFeedSkeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { formatGroupingKey, getGroupingKey } from "@/lib/helpers/dateUtils";
import { useSetArticleCount } from "@/store";
import { Article } from "@/types/article";
import { useEffect } from "react";

interface ContinuousFeedProps {
  initialArticles: Article[];
  initialCursor: string | null;
  category: string;
  sort: string;
  search: string;
  region: string;
  origin: string;
  type: string;
  story: string;
  bias: string;
  scope: string;
}

export default function ContinuousFeed({
  initialArticles,
  initialCursor,
  category,
  sort,
  search,
  region,
  origin,
  type,
  story,
  bias,
  scope,
}: ContinuousFeedProps) {
  const {
    items: articles,
    isLoading,
    error,
    cursor,
    sentinelRef,
    handleRetry,
  } = useInfiniteScroll<Article>({
    endpoint: "/api/articles",
    queryParams: {
      category,
      sort,
      search,
      region,
      origin,
      type,
      story,
      bias,
      scope,
    },
    initialItems: initialArticles,
    initialCursor,
    dataKey: "articles",
    fetchDependencies: [
      category,
      sort,
      search,
      region,
      origin,
      type,
      story,
      bias,
      scope,
    ],
  });

  const setArticleCount = useSetArticleCount();

  // Keep the store in sync with the live article list
  useEffect(() => {
    setArticleCount(articles.length);
  }, [articles.length, setArticleCount]);

  // Grouping logic (purely visual for Continuous Feed)
  const groups: { key: string; articles: Article[] }[] = [];

  articles.forEach((article) => {
    const key = getGroupingKey(article.publishedAt);
    const existingGroup = groups.find((g) => g.key === key);

    if (existingGroup) {
      existingGroup.articles.push(article);
    } else {
      groups.push({ key, articles: [article] });
    }
  });

  return (
    <div className="flex flex-col gap-8">
      {groups.length === 0 && !isLoading ? (
        <p className="text-muted-foreground text-sm py-20 text-center">
          {search ? (
            <>
              No articles found for{" "}
              <span className="text-foreground font-medium">
                &quot;{search}&quot;
              </span>
            </>
          ) : (
            "No articles available."
          )}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="space-y-5">
            {/* Date Header */}
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold tracking-tight">
                {formatGroupingKey(group.key)}
              </h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {group.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Pagination error state */}
      {error && <PaginationError onRetry={handleRetry} />}

      {/* Sentinel */}
      {!error && (
        <div>
          <div ref={sentinelRef}>
            {isLoading && <ArticleFeedLoadingGrid />}

            {!cursor && !isLoading && groups.length > 0 && (
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground">
                  {"You're all caught up"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
