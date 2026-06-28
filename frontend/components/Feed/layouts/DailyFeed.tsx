"use client";

import { useCallback, useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import ArticleCard from "@/components/articles/ArticleCard";
import { ArticleFeedLoadingGrid } from "@/components/Feed/FeedSkeleton";
import { Article } from "@/types/article";
import { useSetArticleCount } from "@/store";
import { Button } from "@/components/ui/button";
import { getGroupingKey, formatGroupingKey } from "@/lib/helpers/dateUtils";
import { buildFeedQueryParams } from "@/lib/helpers/feedUtils";
import { PaginationError } from "@/components/Feed/PaginationError";

interface DailyFeedProps {
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

export default function DailyFeed({
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
}: DailyFeedProps) {
  const setArticleCount = useSetArticleCount();

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state based on the newest date in the initial articles
  const [{ currentDate, articles, cursor }, setFeedState] = useState(() => {
    if (initialArticles.length === 0) {
      return {
        currentDate: new Date().toISOString().split("T")[0],
        articles: [],
        cursor: null,
      };
    }

    // Find the grouping key (YYYY-MM-DD) of the very first (newest) article
    const firstArticleKey = getGroupingKey(initialArticles[0].publishedAt);

    // Filter to keep ONLY the articles from this newest date
    const dateArticles = initialArticles.filter(
      (a) => getGroupingKey(a.publishedAt) === firstArticleKey,
    );

    // If we kept all 20, there might be more for this day, so use initialCursor.
    // If we kept less than 20, the rest were older days, meaning this day is fully exhausted.
    const dateCursor =
      dateArticles.length === initialArticles.length ? initialCursor : null;

    return {
      currentDate: firstArticleKey,
      articles: dateArticles,
      cursor: dateCursor,
    };
  });

  // Keep the store in sync with the live article list
  useEffect(() => {
    setArticleCount(articles.length);
  }, [articles.length, setArticleCount]);

  const fetchNextPage = useCallback(async () => {
    // Prevent fetching if already loading, error, or if this day is fully loaded
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
        date: currentDate,
      });

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const { articles: next, nextCursor } = await res.json();

      setFeedState((prev) => ({
        ...prev,
        articles: [...prev.articles, ...next],
        cursor: nextCursor,
      }));
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
    currentDate,
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

  const loadPreviousDay = async () => {
    if (isLoading) return;
    setLoading(true);
    setError(null);

    try {
      // Calculate previous day
      const dateObj = new Date(currentDate);
      dateObj.setUTCDate(dateObj.getUTCDate() - 1);
      const prevDate = dateObj.toISOString().split("T")[0];

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
        date: prevDate,
      });

      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const { articles: next, nextCursor } = await res.json();

      setFeedState({
        currentDate: prevDate,
        articles: next,
        cursor: nextCursor,
      });

      // Scroll to top of the feed container smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to load previous day:", err);
      setError("Failed to load previous day. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Intersection observer logic for within-day pagination
  const sentinelRef = useIntersectionObserver(
    fetchNextPage,
    !error && cursor !== null,
    "200px",
  );

  const handleRetry = () => {
    setError(null);
    if (cursor) {
      fetchNextPage();
    } else {
      loadPreviousDay();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-5">
        {/* Date Header */}
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold tracking-tight">
            {formatGroupingKey(currentDate)}
          </h3>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {articles.length === 0 && !isLoading ? (
          <p className="text-muted-foreground text-sm py-20 text-center">
            No articles ingested on this date.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination error state */}
      {error && <PaginationError message={error} onRetry={handleRetry} />}

      {!error && (
        <div>
          {/* If the day is fully loaded (cursor is null), show the Load Previous Day button */}
          {!cursor ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-2xl border border-border/50">
              <p className="text-muted-foreground font-medium mb-4 text-lg">
                You've reached the end of{" "}
                {formatGroupingKey(currentDate).toLowerCase()}.
              </p>

              <Button
                onClick={loadPreviousDay}
                variant="outline"
                className="rounded-full"
                disabled={isLoading}
              >
                Go to{" "}
                {formatGroupingKey(
                  new Date(
                    new Date(currentDate).getTime() - 24 * 60 * 60 * 1000,
                  )
                    .toISOString()
                    .split("T")[0],
                ).toLowerCase()}
                ?
              </Button>
            </div>
          ) : (
            /* Otherwise, Sentinel for infinite scroll */
            <div ref={sentinelRef}>
              {isLoading && <ArticleFeedLoadingGrid />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
