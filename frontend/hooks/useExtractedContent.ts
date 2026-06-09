"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_PREFIX = "extracted:";
const INDEX_KEY = "extracted:index";
const MAX_BYTES = 4.5 * 1024 * 1024;

interface CachedContent {
  content: string;
  source: string;
  cachedAt: number;
}

function getCacheKey(url: string): string {
  return STORAGE_PREFIX + url;
}

function getCacheIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCacheIndex(index: string[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // storage full — handled on next write
  }
}

function pruneCache(neededBytes: number): void {
  const index = getCacheIndex();
  if (index.length === 0) return;

  let total = 0;
  for (const url of index) {
    try {
      const raw = localStorage.getItem(getCacheKey(url));
      if (raw) total += raw.length * 2;
    } catch {
      // ignore
    }
  }

  while (total + neededBytes > MAX_BYTES && index.length > 0) {
    const oldest = index.shift()!;
    try {
      const raw = localStorage.getItem(getCacheKey(oldest));
      if (raw) total -= raw.length * 2;
      localStorage.removeItem(getCacheKey(oldest));
    } catch {
      // ignore
    }
  }

  saveCacheIndex(index);
}

function readFromCache(url: string): CachedContent | null {
  try {
    const raw = localStorage.getItem(getCacheKey(url));
    if (!raw) return null;
    return JSON.parse(raw) as CachedContent;
  } catch {
    return null;
  }
}

function writeToCache(url: string, content: string, source: string): void {
  try {
    const entry: CachedContent = { content, source, cachedAt: Date.now() };
    const serialized = JSON.stringify(entry);
    pruneCache(serialized.length * 2);

    localStorage.setItem(getCacheKey(url), serialized);

    const index = getCacheIndex().filter((u) => u !== url);
    index.push(url);
    saveCacheIndex(index);
  } catch {
    // Cache write failed — content still usable from this session
  }
}

export function readFromLocalCache(url: string): string | null {
  if (typeof window === "undefined") return null;
  return readFromCache(url)?.content ?? null;
}

interface UseExtractedContentOptions {
  url: string;
  enabled?: boolean;
  initialContent?: string | null;
}

export function useExtractedContent({
  url,
  enabled = true,
  initialContent,
}: UseExtractedContentOptions) {
  const [content, setContent] = useState<string | null>(() => {
    if (initialContent) return initialContent;
    if (typeof window === "undefined") return null;
    return readFromCache(url)?.content ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return readFromCache(url)?.source ?? "";
  });

  const extract = useCallback(async () => {
    const cached = readFromCache(url);
    if (cached) {
      setContent(cached.content);
      setSource(cached.source);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed to extract");
      const data = await res.json();
      setContent(data.content);
      setSource(data.source || "");
      writeToCache(url, data.content, data.source || "");
    } catch {
      setError("Failed to extract content. Try viewing the original instead.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (enabled && !content) {
      extract();
    }
  }, [enabled, content, extract]);

  const isCached = !!initialContent || (typeof window !== "undefined" && !!readFromLocalCache(url));

  return { content, loading, error, source, extract, isCached };
}
