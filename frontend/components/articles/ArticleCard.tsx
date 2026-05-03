import { Sparkles } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentimentBadge } from "./SentimentBadge";
import { Article } from "@/types/article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRelativeTime, getBiasBadgeVariant } from "@/lib/utils";

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
            <CardTitle className="text-lg font-semibold leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-500 transition-colors line-clamp-2">
              {article.title}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            {article.biasCategory && (
              <Badge variant={getBiasBadgeVariant(article.biasCategory)}>
                {article.biasCategory}
              </Badge>
            )}

            <Link
              href={`/?chat=${article.id}`}
              scroll={false}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-accent transition-all opacity-80 group-hover:opacity-100"
              title="Ask AI about this article"
            >
              <HugeiconsIcon icon={Sparkles} className="w-4 h-4" />
            </Link>
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
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.contentSnippet}
          </p>
        </Link>

        {/* Category tags */}
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
      </CardContent>

      {/* Footer: Bias + Perspective */}
      {/*<CardFooter className="border-t flex items-center justify-between mt-auto">
        <div className="flex items-center space-x-2 w-full justify-between">
          {article.biasCategory && (
            <span className="text-[10px] font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {article.biasCategory}
            </span>
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
      </CardFooter>*/}
    </Card>
  );
}
