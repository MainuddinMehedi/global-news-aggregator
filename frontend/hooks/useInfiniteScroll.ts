import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCallback, useState } from "react";

export interface UseInfiniteScrollOptions<T> {
  endpoint: string;
  queryParams?: Record<string, string | undefined | null>;
  initialItems?: T[];
  initialCursor?: string | null;
  dataKey: string;
  fetchDependencies?: any[];
  observerRootMargin?: string;
}

export function useInfiniteScroll<T>({
  endpoint,
  queryParams = {},
  initialItems = [],
  initialCursor = null,
  dataKey,
  fetchDependencies = [],
  observerRootMargin = "200px",
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNextPage = useCallback(async () => {
    // Prevent fetching if already loading, error, or fully exhausted
    if (!cursor || isLoading || error) return;
    setLoading(true);

    try {
      const searchParams = new URLSearchParams();

      // Append user-provided query params
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });

      // Append the pagination cursor
      searchParams.append("cursor", cursor);

      const res = await fetch(`${endpoint}?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const nextItems = data[dataKey] || [];
      const nextCursor = data.nextCursor;

      setItems((prev) => [...prev, ...nextItems]);
      setCursor(nextCursor);
    } catch (err) {
      console.error(`Failed to load more ${dataKey}:`, err);
      setError(
        err instanceof Error
          ? `Failed to load more: ${err.message}`
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, isLoading, error, endpoint, dataKey, ...fetchDependencies]);

  // Use the existing intersection observer logic
  const sentinelRef = useIntersectionObserver(
    fetchNextPage,
    !error && cursor !== null,
    observerRootMargin,
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setTimeout(() => {
      fetchNextPage();
    }, 0);
  }, [fetchNextPage]);

  return {
    items,
    setItems,
    cursor,
    setCursor,
    isLoading,
    setLoading,
    error,
    setError,
    sentinelRef,
    handleRetry,
    fetchNextPage,
  };
}
