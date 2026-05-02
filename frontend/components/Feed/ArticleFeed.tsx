"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArticleCard from "@/components/articles/ArticleCard";
import { ArticleCardSkeleton } from "@/components/Feed/FeedSkeleton";
import { Article } from "@/types/article";
import { useSetArticleCount } from "@/store";

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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const setArticleCount = useSetArticleCount();

  // Keep the store in sync with the live article list
  useEffect(() => {
    setArticleCount(articles.length);
  }, [articles.length, setArticleCount]);

  const fetchNextPage = useCallback(async () => {
    if (!cursor || isLoading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ category, sort, search, cursor });
      const res = await fetch(`/api/articles?${params}`);

      if (!res.ok) throw new Error("Failed to fetch");

      const { articles: next, nextCursor } = await res.json();
      setArticles((prev) => [...prev, ...next]);
      setCursor(nextCursor);
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, isLoading, category, sort, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  return (
    <div>
      {articles.length === 0 && !isLoading ? (
        <p className="text-muted-foreground text-sm py-10 text-center">
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
          <div key={article.id} className="mb-5">
            <ArticleCard article={article} />
          </div>
        ))
      )}

      {/* Sentinel watched by IntersectionObserver */}
      <div ref={sentinelRef}>
        {isLoading && (
          <div className="space-y-5 pb-5">
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
    </div>
  );
}
