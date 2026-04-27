"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { Article } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface ArticlesResponse {
  articles: Article[];
  nextCursor?: string;
}

async function fetchArticles({
  pageParam,
  category,
  search,
}: {
  pageParam?: string;
  category: string;
  search: string;
}): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("q", search);
  if (pageParam) params.set("cursor", pageParam);

  const res = await fetch(`/api/articles?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch articles");
  return res.json();
}

export function useArticles() {
  const { activeCategory, searchQuery } = useAppStore();

  return useInfiniteQuery({
    queryKey: ["articles", activeCategory, searchQuery],
    queryFn: ({ pageParam }) =>
      fetchArticles({
        pageParam,
        category: activeCategory,
        search: searchQuery,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30000, // 30s
    refetchOnWindowFocus: false,
  });
}
