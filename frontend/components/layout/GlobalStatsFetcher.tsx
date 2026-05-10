"use client";

import { useEffect } from "react";
import {
  useSetArticleCount,
  useSetStoryCount,
  useSetTotalMatchCount,
} from "@/store";

interface GlobalStatsFetcherProps {
  articleCount: number;
  storyCount: number;
  topicMatchCount: number;
}

export default function GlobalStatsFetcher({
  articleCount,
  storyCount,
  topicMatchCount,
}: GlobalStatsFetcherProps) {
  const setArticleCount = useSetArticleCount();
  const setStoryCount = useSetStoryCount();
  const setTotalMatchCount = useSetTotalMatchCount();

  useEffect(() => {
    setArticleCount(articleCount);
    setStoryCount(storyCount);
    setTotalMatchCount(topicMatchCount);
  }, [
    articleCount,
    storyCount,
    topicMatchCount,
    setArticleCount,
    setStoryCount,
    setTotalMatchCount,
  ]);

  return null;
}
