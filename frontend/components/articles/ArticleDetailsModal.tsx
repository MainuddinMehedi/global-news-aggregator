"use client";

import { Article } from "@/types/article";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge } from "./SentimentBadge";
import { formatRelativeTime, getEventRegionBadgeVariant } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Sparkles } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";

export function ArticleDetailsModal({ article }: { article: Article | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Open if there is an article object passed
  const isOpen = !!article;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      // Remove the article param from URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("article");
      router.push(`/?${newParams.toString()}`, { scroll: false });
    }
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[52rem] max-h-[85vh] flex-col overflow-y-auto p-0 rounded-lg border border-border/50 shadow-2xl no-scrollbar">
        <DialogHeader className="px-5 py-4 border-b border-border/50 shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[9px] font-bold text-secondary-foreground">
              {article.source.substring(0, 2).toUpperCase()}
            </span>
            <span className="font-medium text-base text-muted-foreground mr-2">
              {article.source}
            </span>
            {/*<Badge variant="neutral">{article.source}</Badge>*/}

            <span className="text-xs text-muted-foreground font-medium">
              <RelativeTime date={article.publishedAt} />
            </span>
            <SentimentBadge score={article.sentimentScore || 0} />
          </div>

          <DialogTitle className="text-xl font-bold leading-snug text-foreground pr-8 text-left">
            {article.title}
          </DialogTitle>

          {/*screenreader only thing*/}
          <DialogDescription className="sr-only">
            Detailed view of the article: {article.title}
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 py- space-y-5 bg-card">
          {/* AI Analysis Section */}
          {/*<div className="mb- p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative">
            <button
              className="absolute top-3 right-3 p-1.5 hover:bg-emerald-500/10 rounded-md text-emerald-500 hover:text-emerald-400 transition-colors opacity-80 hover:opacity-100"
              title="Discuss with AI"
            >
              <HugeiconsIcon icon={Sparkles} className="w-4 h-4" />
            </button>
            <div className="font-bold text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              ✨ AI Analysis
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground/80">Bias Category:</span>
                <Badge variant={getBiasBadgeVariant(article.biasCategory)}>
                  {article.biasCategory || "Neutral"}
                </Badge>
              </div>
              {article.perspectiveCountries &&
                article.perspectiveCountries.length > 0 && (
                  <div>
                    <span className="text-muted-foreground/80">Focus:</span>{" "}
                    <span className="font-medium text-foreground">
                      {article.perspectiveCountries.join(", ")}
                    </span>
                  </div>
                )}
            </div>

            {article.biasNote && (
              <div className="mt-3 text-xs text-muted-foreground/90 border-t border-emerald-500/10 pt-3">
                <span className="font-medium text-foreground/80">
                  Loaded Terms:
                </span>{" "}
                {article.biasNote}
              </div>
            )}
          </div>*/}

          {/*-----------------------*/}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HugeiconsIcon
                  icon={Sparkles}
                  className="w-4 h-4 text-emerald-400"
                />
                <span className="text-xs font-bold text-emerald-300">
                  AI Analysis
                </span>
              </div>
              <button
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                title="Discuss with AI"
              >
                <HugeiconsIcon icon={Sparkles} className="w-4 h-4" />
                <span>Discuss with AI</span>
              </button>
            </div>

            {/*Framing + perspective countries */}
            <div className="grid grid-cols-3">
              <div>
                <span className="text-xs text-muted-foreground/80 tracking-tighter uppercase">
                  Framing
                </span>
                <p className="text-sm text-zinc-300 mt-1">
                  {article.biasNote || "Analysis pending..."}
                </p>
              </div>
              <div className="mx-auto">
                <span className="text-xs text-muted-foreground/80 tracking-tighter uppercase">
                  Perspective Countries
                </span>
                <p className="text-sm text-zinc-300 mt-1">
                  {article.perspectiveCountries.length > 0
                    ? article.perspectiveCountries.join(", ")
                    : "Not analyzed"}
                </p>
              </div>
              <div className="mx-auto space-y-2">
                <span className="text-xs block text-muted-foreground/80 tracking-tighter uppercase">
                  Event Region:
                </span>
                <Badge variant={getEventRegionBadgeVariant(article.eventRegion)}>
                  {article.eventRegion || "Unknown"}
                </Badge>
              </div>
            </div>

            {/* Loaded Terms/entities section */}
            <div className="mt-3 pt-3 border-t border-emerald-500/10">
              <span className="text-xs text-zinc-500 tracking-tighter uppercase">
                {/*Loaded Terms*/}
                Entities
              </span>

              {article.entities && article.entities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {article.entities.map((entity, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-muted-foreground"
                    >
                      {entity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/*-----------------------*/}

          {/* Main Snippet */}
          <div className="prose dark:prose-invert max-w-none mb-">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {article.contentSnippet}
            </p>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 gap-6 pt-5 mt- border-t border-border/50">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {/*Tags & Entities*/}
                Categories
              </h4>

              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {article.categories.map((cat) => (
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

              {/*{article.entities && article.entities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {article.entities.map((entity, i) => (
                    <Badge key={i} variant="purple">
                      {entity}
                    </Badge>
                  ))}
                </div>
              )}*/}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/50 backdrop-blur-sm shrink-0 flex justify-end">
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
          >
            <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
            Read Full Article
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
