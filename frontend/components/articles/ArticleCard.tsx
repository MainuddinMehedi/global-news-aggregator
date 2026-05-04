"use client";

import { SentimentBadge } from "./SentimentBadge";
import { Article } from "@/types/article";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRelativeTime, getBiasBadgeVariant } from "@/lib/utils";
import AiButton from "./AiButton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@hugeicons/core-free-icons";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="h-full flex flex-col gap-3 group hover:border-primary/50 transition-colors duration-200">
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/?article=${article.id}`}
            scroll={false}
            className="flex-1"
          >
            <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            {article.biasCategory && (
              <Badge variant={getBiasBadgeVariant(article.biasCategory)}>
                {article.biasCategory}
              </Badge>
            )}

            <AiButton article={article} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Source · Time · Sentiment */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-[9px] font-bold text-secondary-foreground">
            {article.source.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-muted-foreground">
            {article.source}
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {formatRelativeTime(article.publishedAt)}
          </span>
          <span className="text-border">·</span>
          <SentimentBadge score={article.sentimentScore || 0} />
        </div>

        {/* Snippet */}
        <Link
          href={`/?article=${article.id}`}
          scroll={false}
          className="flex-1 block"
        >
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {article.contentSnippet}
          </p>
        </Link>

        {/* Category tags */}
        <div className="flex justify-between items-center">
          {article.categories && article.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {article.categories.slice(0, 3).map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="capitalize text-muted-foreground"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}

          {article.perspectiveCountries &&
            article.perspectiveCountries.length > 0 && (
              <div className="flex items-center space-x-1 ml-auto">
                <HugeiconsIcon
                  icon={Globe}
                  className="w-3 h-3 text-muted-foreground"
                />
                <span className="text-[10px] text-muted-foreground">
                  {article.perspectiveCountries.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
