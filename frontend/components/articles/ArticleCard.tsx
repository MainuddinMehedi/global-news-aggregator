import { SentimentBadge } from "./SentimentBadge";
import { Article } from "@/types/article";
import BookmarkButton from "@/components/bookmarks/BookmarkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn, formatRelativeTime, getEventRegionBadgeVariant } from "@/lib/utils";
import AiButton from "./AiButton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@hugeicons/core-free-icons";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { SourceAvatar } from "@/components/ui/SourceAvatar";

export default function ArticleCard({
  article,
  storySlug,
}: {
  article: Article;
  storySlug?: string;
}) {
  const articleHref = storySlug
    ? `/article/${article.slug || article.id}?story=${storySlug}`
    : `/article/${article.slug || article.id}`;

  return (
    <Card className="h-full flex flex-col gap-3 group hover:border-primary/50 transition-colors duration-200">
      <CardHeader className="">
        <div className="flex items-start justify-between gap-2">
          <Link href={articleHref} scroll={false} className="flex-1">
            <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            {article.eventRegion && (
              <Badge
                variant={getEventRegionBadgeVariant(article.eventRegion)}
                className="hidden sm:inline-flex"
              >
                {article.eventRegion}
              </Badge>
            )}
            <BookmarkButton type="article" targetId={article.id} />
            <AiButton article={article} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Source · Time · Sentiment */}
        <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
          <SourceAvatar
            name={article.source}
            url={article.url}
            className="w-5 h-5 rounded"
          />
          <span className="font-semibold text-foreground/80">
            {article.source}
          </span>
          {article.biasGroup && (
            <span className="inline-flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded border border-border/40 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
              {article.biasGroup}
            </span>
          )}
          <span className="text-border">·</span>
          <span className="text-muted-foreground font-medium text-[10px]">
            <RelativeTime date={article.publishedAt} />
          </span>
          <span className="text-border">·</span>
          <SentimentBadge score={article.sentimentScore || 0} />
        </div>

        {/* Snippet */}
        <Link href={articleHref} scroll={false} className="flex-1 block">
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

          <div className="flex items-center space-x-3 ml-auto">
            {article.sourceType && (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {article.sourceType}
              </span>
            )}
            {article.sourceOrigin && (
              <div className="flex items-center space-x-1">
                <HugeiconsIcon
                  icon={Globe}
                  className="w-3 h-3 text-muted-foreground"
                />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {article.sourceOrigin}
                </span>
              </div>
            )}
            {article.coverageScope && (
              <span className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-widest border border-border/40 px-1.5 py-0.5 rounded-md bg-muted/10">
                {article.coverageScope}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
