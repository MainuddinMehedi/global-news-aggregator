import AiButton from "@/components/articles/AiButton";
import ArticleViewer from "@/components/articles/ArticleViewer";
import { SentimentBadge } from "@/components/articles/SentimentBadge";
import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Article } from "@/types/article";
import { getEventRegionBadgeVariant } from "@/utils/analytics";
import {
  ArrowLeft,
  Calendar03Icon,
  Globe,
  Sparkles,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

interface ArticleDetailViewProps {
  article: Article;
  isModal?: boolean;
  storySlug?: string;
}

export function ArticleDetailView({
  article,
  isModal,
  storySlug,
}: ArticleDetailViewProps) {
  return (
    <div
      className={`w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${!isModal ? "mx-auto max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8" : ""}`}
    >
      {!isModal && (
        <Link
          href={storySlug ? `/stories/${storySlug}` : "/"}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft} className="w-4 h-4 mr-1" />
          {storySlug ? "Go Back" : "Back to Feed"}
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {article.categories?.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="capitalize">
                  {cat.name}
                </Badge>
              ))}

              <span className="text-xs text-muted-foreground/80 tracking-tighter uppercase">
                Event Region:
              </span>
              <Badge variant={getEventRegionBadgeVariant(article.eventRegion)}>
                {article.eventRegion || "Unknown"}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground">
                  {article.source.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-medium text-foreground">
                  {article.source}
                </span>
                {article.sourceOrigin && (
                  <span className="text-xs px-1.5 py-0.5 bg-secondary/50 rounded-md">
                    {article.sourceOrigin}
                  </span>
                )}
                {article.sourceType && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {article.sourceType}
                  </span>
                )}
                {article.biasGroup && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-md font-semibold">
                    {article.biasGroup}
                  </span>
                )}
                {article.coverageScope && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 rounded-md font-semibold">
                    {article.coverageScope}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} className="w-4 h-4" />
                <RelativeTime date={article.publishedAt} />
              </div>
            </div>
          </div>

          <ArticleViewer
            article={{
              url: article.url,
              source: article.source,
              contentSnippet: article.contentSnippet,
              extractedContent: article.extractedContent,
            }}
          />
        </div>

        {/* Intelligence widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Sparkles}
                    className="w-[18px] h-[18px] text-primary"
                  />
                  Intelligence
                </h3>
                <AiButton article={article} />
              </div>

              {/* Sentiment */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sentiment
                </p>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50 flex items-center justify-between">
                  <SentimentBadge
                    score={article.sentimentScore}
                    showScore={true}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Bias Note */}
              {article.biasNote && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bias Analysis
                  </p>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm leading-relaxed text-foreground/80">
                    {article.biasNote}
                  </div>
                </div>
              )}

              {/* Entities */}
              {article.entities && article.entities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key Entities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {article.entities.map((entity, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-background/50 text-xs font-normal"
                      >
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Publisher Profile */}
              {(article.sourceType ||
                article.sourceOrigin ||
                article.biasGroup ||
                article.coverageScope) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Publisher Profile
                  </p>
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-background/50 border border-border/50">
                    {article.sourceType && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground/80">
                          {article.sourceType}
                        </span>
                      </div>
                    )}
                    {article.sourceOrigin && (
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Globe}
                          className="w-3.5 h-3.5 text-muted-foreground"
                        />
                        <span className="text-xs text-muted-foreground/80">
                          Based in {article.sourceOrigin}
                        </span>
                      </div>
                    )}
                    {article.biasGroup && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground/80">
                          Bias Leaning: {article.biasGroup}
                        </span>
                      </div>
                    )}
                    {article.coverageScope && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground/80">
                          Coverage: {article.coverageScope}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
