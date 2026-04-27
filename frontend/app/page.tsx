"use client";

import { useArticles } from "@/hooks/useArticles";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

const categories = [
  "all",
  "geopolitics",
  "bangladesh",
  "technology",
  "conflict",
  "economy",
  "environment",
  "health",
];

export default function FeedPage() {
  const { activeCategory, setCategory } = useAppStore();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useArticles();

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const articles = data?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <div className="pl-4 pr-2 lg:pl-6 lg:pr-2 py-4 lg:py-6 space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${
                activeCategory === cat
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
            Sort:
          </span>
          <select className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md py-1.5 px-2 focus:outline-none">
            <option>Latest</option>
            <option>Relevance</option>
            <option>Bias Score</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
          Failed to load articles. Check your connection and try again.
        </div>
      )}

      {/* Articles Grid */}
      {!isLoading && articles.length === 0 && (
        <div className="text-center text-zinc-500 py-20 bg-card rounded-xl border border-border">
          <p className="text-lg font-medium mb-2">No articles found</p>
          <p className="text-sm">
            {activeCategory !== "all"
              ? `No articles in the "${activeCategory}" category. Try "All".`
              : "Run the ingestion service to populate the feed."}
          </p>
        </div>
      )}

      {articles.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        )}
      </div>
    </div>
  );
}
