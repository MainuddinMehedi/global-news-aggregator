import { getArticleById } from "@/queries/articles";
import { notFound } from "next/navigation";
import { SentimentBadge } from "@/components/articles/SentimentBadge";
import { Badge } from "@/components/ui/badge";
import { getBiasBadgeVariant, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe } from "@hugeicons/core-free-icons";
import AiButton from "@/components/articles/AiButton";

export default async function ArticleDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleById(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Feed
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
                <span className="font-medium text-foreground">{article.source}</span>
                {article.sourceCountry && (
                  <span className="text-xs">({article.sourceCountry})</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                {formatRelativeTime(article.publishedAt)}
              </div>
            </div>
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.contentSnippet}
            </p>
          </div>

          <div className="pt-6 border-t border-border/50">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
            >
              Read Full Article on {article.source}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/50 shadow-xl backdrop-blur-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="m12 14 4-4"/>
                    <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
                  </svg>
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
                  <SentimentBadge score={article.sentimentScore} showScore={true} className="text-sm" />
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
                      <Badge key={i} variant="outline" className="bg-background/50 text-xs font-normal">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Perspective Countries */}
              {article.perspectiveCountries && article.perspectiveCountries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Geographic Focus
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {article.perspectiveCountries.map((country, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-sm text-foreground/80 bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/50">
                        <HugeiconsIcon icon={Globe} className="w-3.5 h-3.5 text-muted-foreground" />
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
