"use client";

import { useEffect } from "react";
import {
  useSetArticleCount,
  useSetLockedTopicCount,
  useSetStoryCount,
  useSetTotalMatchCount,
} from "@/store";

interface GlobalStatsFetcherProps {
  articleCount: number;
  storyCount: number;
  topicMatchCount: number;
  lockedTopicCount: number;
}

export default function GlobalStatsFetcher({
  articleCount,
  storyCount,
  topicMatchCount,
  lockedTopicCount,
}: GlobalStatsFetcherProps) {
  const setArticleCount = useSetArticleCount();
  const setStoryCount = useSetStoryCount();
  const setTotalMatchCount = useSetTotalMatchCount();
  const setLockedTopicCount = useSetLockedTopicCount();

  useEffect(() => {
    setArticleCount(articleCount);
    setStoryCount(storyCount);
    setTotalMatchCount(topicMatchCount);
    setLockedTopicCount(lockedTopicCount);
  }, [
    articleCount,
    storyCount,
    topicMatchCount,
    lockedTopicCount,
    setArticleCount,
    setStoryCount,
    setTotalMatchCount,
    setLockedTopicCount,
  ]);

  return null;
}
