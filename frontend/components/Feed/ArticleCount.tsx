"use client";

import { useArticleCount } from "@/store";

export function ArticleCount() {
  const count = useArticleCount();

  return (
    <p className="text-xs text-muted-foreground leading-none">
      <span className="font-semibold text-foreground tabular-nums">{count}</span>{" "}
      articles
    </p>
  );
}
