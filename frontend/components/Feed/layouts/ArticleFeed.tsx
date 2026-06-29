"use client";

import { Article } from "@/types/article";
import { useSettings } from "@/store";
import ContinuousFeed from "@/components/Feed/layouts/ContinuousFeed";
import DailyFeed from "@/components/Feed/layouts/DailyFeed";

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
