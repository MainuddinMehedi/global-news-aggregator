"use client";

import ContinuousFeed from "@/components/Feed/layouts/ContinuousFeed";
import DailyFeed from "@/components/Feed/layouts/DailyFeed";
import { useSettings } from "@/store";
import { Article } from "@/types/article";

export interface ArticleFeedProps {
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

export default function ArticleFeed(props: ArticleFeedProps) {
  const { settings } = useSettings();

  const mode = settings.homePageMode || "daily";

  if (mode === "continuous") {
    return <ContinuousFeed {...props} />;
  }

  return <DailyFeed {...props} />;
}
