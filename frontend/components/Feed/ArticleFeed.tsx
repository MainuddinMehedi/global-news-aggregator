"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArticleCard from "@/components/articles/ArticleCard";
import { ArticleCardSkeleton } from "@/components/Feed/FeedSkeleton";
import { Article } from "@/types/article";
import { useSetArticleCount } from "@/store";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";

interface ArticleFeedProps {
  initialArticles: Article[];
  initialCursor: string | null;
  category: string;
  sort: string;
  search: string;
}

export default function ArticleFeed({
  initialArticles,
  initialCursor,
  category,
  sort,
  search,
}: ArticleFeedProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const setArticleCount = useSetArticleCount();

  // Keep the store in sync with the live article list
  useEffect(() => {
    setArticleCount(articles.length);
  }, [articles.length, setArticleCount]);

  const fetchNextPage = useCallback(async () => {
    // Prevent fetching if already loading or if there's an active error
    if (!cursor || isLoading || error) return;
    setLoading(true);

    // fetch articles | catch errors
    try {
      const params = new URLSearchParams({ category, sort, search, cursor });
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
  }, [cursor, isLoading, error, category, sort, search]);

  // Intersection observer logic
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "100px" }, // was 300px
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, error]);

  // Pagination fetch retry logic
  const handleRetry = () => {
    setError(null);
    // Push the fetch to the end of the event loop to ensure state clears first
    setTimeout(() => {
      fetchNextPage();
    }, 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {articles.length === 0 && !isLoading ? (
        <p className="col-span-full text-muted-foreground text-sm py-10 text-center">
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
        articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))
      )}

      {/* Pagination error state */}
      {error && (
        <div className="col-span-full flex flex-col items-center justify-center py-6 px-4 text-center bg-destructive/5 rounded-xl border border-destructive/10">
          <p className="text-sm font-medium text-destructive mb-3">
            Failed to load more articles. Please check your connection.
          </p>
          <Button
            onClick={handleRetry}
            variant="default"
            className="rounded-full px-6"
          >
            <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Sentinel watched by IntersectionObserver */}
      {!error && (
        <div ref={sentinelRef} className="col-span-full">
          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-5">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
          )}
          {!cursor && !isLoading && articles.length > 0 && (
            <div className="flex items-center justify-center py-6">
              <p className="text-xs text-muted-foreground">
                {"You're all caught up"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
