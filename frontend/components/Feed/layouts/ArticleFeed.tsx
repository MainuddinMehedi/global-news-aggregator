"use client";

import ContinuousFeed from "@/components/Feed/layouts/ContinuousFeed";
import DailyFeed from "@/components/Feed/layouts/DailyFeed";
import { Article } from "@/types/article";

export interface ArticleFeedProps {
  mode: string;
  initialArticles: Article[];
  initialCursor: string | null;
  initialDate?: string;
  category: string;
  sort: string;
  search: string;
  region: string;
  srcOrigin: string;
  type: string;
  story: string;
  bias: string;
  scope: string;
}

export default function ArticleFeed(props: ArticleFeedProps) {
  const { mode } = props;

  if (mode === "continuous") {
    return <ContinuousFeed {...props} />;
  }

  return <DailyFeed {...props} />;
}
