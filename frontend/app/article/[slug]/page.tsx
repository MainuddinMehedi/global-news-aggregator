import { getArticleById } from "@/queries/articles";
import { notFound } from "next/navigation";
import { SentimentBadge } from "@/components/articles/SentimentBadge";
import { Badge } from "@/components/ui/badge";
import { getBiasBadgeVariant, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft,
  Calendar03Icon,
  Globe,
  Sparkles,
} from "@hugeicons/core-free-icons";
import AiButton from "@/components/articles/AiButton";
import ArticleViewer from "@/components/articles/ArticleViewer";
import { RelativeTime } from "@/components/ui/RelativeTime";

export default async function ArticleDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const storySlug =
    typeof resolvedSearchParams.story === "string"
      ? resolvedSearchParams.story
      : undefined;
  const article = await getArticleById(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w- px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href={storySlug ? `/stories/${storySlug}` : "/"}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft} className="w-4 h-4 mr-1" />
        {storySlug ? "Go Back" : "Back to Feed"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {article.categories?.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="capitalize">
                  {cat.name}
                </Badge>
              ))}
              {article.biasCategory && (
                <Badge variant={getBiasBadgeVariant(article.biasCategory)}>
                  {article.biasCategory}
                </Badge>
              )}
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
                {article.sourceCountry && (
                  <span className="text-xs">({article.sourceCountry})</span>
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

              {/* Perspective Countries */}
              {article.perspectiveCountries &&
                article.perspectiveCountries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Geographic Focus
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {article.perspectiveCountries.map((country, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-sm text-foreground/80 bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/50"
                        >
                          <HugeiconsIcon
                            icon={Globe}
                            className="w-3.5 h-3.5 text-muted-foreground"
                          />
                          {country}
                        </div>
                      ))}
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
