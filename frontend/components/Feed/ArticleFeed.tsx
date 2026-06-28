"use client";

import { useCallback, useEffect, useState } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import ArticleCard from "@/components/articles/ArticleCard";
import { ArticleCardSkeleton } from "@/components/Feed/FeedSkeleton";
import { Article } from "@/types/article";
import { useSetArticleCount, useSettings } from "@/store";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { getGroupingKey, formatGroupingKey } from "@/lib/helpers/dateUtils";

interface ArticleFeedProps {
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
  activeStoryTitle?: string;
}

export default function ArticleFeed({
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
}: ArticleFeedProps) {
  const { settings } = useSettings();
  const mode = settings.homePageMode || "continuous";

  const [articles, setArticles] = useState(initialArticles);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentGroupKey, setCurrentGroupKey] = useState<string | null>(null);

  const setArticleCount = useSetArticleCount();

  // Initialize currentGroupKey ONLY when mode or initial data changes.
  // We use initialArticles instead of the ever-growing articles array to prevent
  // infinite scroll fetches from violently resetting the user's view.
  useEffect(() => {
    if (initialArticles.length > 0) {
      setCurrentGroupKey(getGroupingKey(initialArticles[0].publishedAt, mode));
    }
  }, [mode, initialArticles]);

  // Grouping logic
  const groups: { key: string; articles: Article[] }[] = [];
  articles.forEach((article) => {
    const key = getGroupingKey(article.publishedAt, mode);
    const existingGroup = groups.find((g) => g.key === key);
    if (existingGroup) {
      existingGroup.articles.push(article);
    } else {
      groups.push({ key, articles: [article] });
    }
  });

  const currentIndex = groups.findIndex((g) => g.key === currentGroupKey);
  const hasOlderGroupsLoaded =
    currentIndex !== -1 && currentIndex < groups.length - 1;
  const isEndOfCurrentGroup =
    mode !== "continuous" && (!cursor || hasOlderGroupsLoaded);

  let visibleGroups = groups;
  if (mode !== "continuous" && currentGroupKey) {
    visibleGroups = groups.filter((g) => g.key === currentGroupKey);
  }

  const visibleArticlesCount = visibleGroups.reduce(
    (acc, g) => acc + g.articles.length,
    0,
  );

  // Keep the store in sync with the live article list
  useEffect(() => {
    setArticleCount(visibleArticlesCount);
  }, [visibleArticlesCount, setArticleCount]);

  const handleNextGroup = () => {
    if (hasOlderGroupsLoaded) {
      setCurrentGroupKey(groups[currentIndex + 1].key);
    }
  };

  const fetchNextPage = useCallback(async () => {
    // Prevent fetching if already loading or if there's an active error
    if (!cursor || isLoading || error) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ category, sort, search });
      if (region !== "all") params.set("region", region);
      if (origin !== "all") params.set("origin", origin);
      if (type !== "all") params.set("type", type);
      if (story !== "all") params.set("story", story);
      if (bias !== "all") params.set("bias", bias);
      if (scope !== "all") params.set("scope", scope);

      // Search uses offset-based pagination (page), default uses cursor-based
      if (search) {
        params.set("page", cursor);
      } else {
        params.set("cursor", cursor);
      }

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
  const sentinelRef = useIntersectionObserver(
    fetchNextPage,
    !error && !isEndOfCurrentGroup,
    "200px",
  );

  // Pagination fetch retry logic
  const handleRetry = () => {
    setError(null);
    setTimeout(() => {
      fetchNextPage();
    }, 0);
  };

  return (
    <div className="flex flex-col gap-8">
      {visibleGroups.length === 0 && !isLoading ? (
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
        visibleGroups.map((group) => (
          <div key={group.key} className="space-y-5">
            {/* Date/Shift Header */}
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold tracking-tight">
                {formatGroupingKey(group.key, mode)}
              </h3>
              <div className="h-[1px] flex-1 bg-border/50" />
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
      {error && (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-destructive/5 rounded-xl border border-destructive/10">
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

      {/* Sentinel / Daily View Continue Button */}
      {!error && visibleGroups.length > 0 && (
        <div>
          {isEndOfCurrentGroup ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/30 rounded-2xl border border-border/50">
              <p className="text-muted-foreground font-medium mb-4 text-lg">
                You've reached the end of{" "}
                {formatGroupingKey(currentGroupKey || "", mode).toLowerCase()}.
              </p>

              {hasOlderGroupsLoaded ? (
                <Button
                  onClick={handleNextGroup}
                  variant="outline"
                  className="rounded-full"
                >
                  Go to{" "}
                  {formatGroupingKey(
                    groups[currentIndex + 1].key,
                    mode,
                  ).toLowerCase()}
                  ?
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No older news available.
                </p>
              )}
            </div>
          ) : (
            <div ref={sentinelRef}>
              {isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-5">
                  <ArticleCardSkeleton />
                  <ArticleCardSkeleton />
                  <ArticleCardSkeleton />
                  <ArticleCardSkeleton />
                </div>
              )}

              {!cursor && !isLoading && visibleGroups.length > 0 && (
                <div className="flex items-center justify-center py-6">
                  <p className="text-xs text-muted-foreground">
                    {"You're all caught up"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
