"use client";

import ArticleCard from "@/components/articles/ArticleCard";
import { PaginationError } from "@/components/Feed/PaginationError";
import { ArticleFeedLoadingGrid } from "@/components/skeletons/home/ArticleFeedSkeleton";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { formatGroupingKey, getGroupingKey } from "@/lib/helpers/dateUtils";
import { buildFeedQueryParams } from "@/lib/helpers/feedUtils";
import { useSetArticleCount } from "@/store";
import { Article } from "@/types/article";
import { useCallback, useEffect, useState } from "react";

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
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchNextPage = useCallback(async () => {
    // Prevent fetching if already loading or if there's an active error
    if (!cursor || isLoading || error) return;
    setLoading(true);

    try {
      const params = buildFeedQueryParams({
        category,
        sort,
        search,
        region,
        origin,
        type,
        story,
        bias,
        scope,
        cursor,
      });

      const res = await fetch(`/api/articles?${params}`);

      if (!res.ok) throw new Error("Failed to fetch");

      const { articles: next, nextCursor } = await res.json();

      setArticles((prev) => [...prev, ...next]);
      setCursor(nextCursor);
    } catch (err) {
      console.error("Failed to load more articles:", err);

      setError(
        err instanceof Error
          ? `Failed to load more articles: ${err.message}`
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    cursor,
    isLoading,
    error,
    category,
    sort,
    search,
    region,
    origin,
    type,
    story,
    bias,
    scope,
  ]);

  // Intersection observer logic
  const sentinelRef = useIntersectionObserver(fetchNextPage, !error, "200px");

  // Pagination fetch retry logic
  const handleRetry = () => {
    setError(null);
    setTimeout(() => {
      fetchNextPage();
    }, 0);
  };

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
