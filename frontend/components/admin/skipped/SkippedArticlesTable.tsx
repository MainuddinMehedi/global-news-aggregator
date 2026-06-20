"use client";

import { useState, useTransition } from "react";
import { SkippedArticleData, GazetteerConfig } from "@/queries/admin/skipped";
import { forceRecategorizeArticle } from "@/app/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, InformationCircleIcon, Alert01Icon } from "@hugeicons/core-free-icons";
import { formatDistanceToNow } from "date-fns";

interface SkippedArticlesTableProps {
  articles: SkippedArticleData[];
  onSelectArticle: (article: SkippedArticleData) => void;
  selectedArticleId?: string;
  gazetteerConfig: GazetteerConfig;
}

export default function SkippedArticlesTable({
  articles,
  onSelectArticle,
  selectedArticleId,
  gazetteerConfig,
}: SkippedArticlesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recatModalArticle, setRecatModalArticle] = useState<SkippedArticleData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleForceRecat = () => {
    if (!recatModalArticle || !selectedCategory) return;

    startTransition(async () => {
      const res = await forceRecategorizeArticle(recatModalArticle.id, selectedCategory);
      if (res.success) {
        toast.success(`Article successfully reclassified to '${selectedCategory}' and sent to enrichment pipeline.`);
        setRecatModalArticle(null);
        setSelectedCategory("");
        router.refresh();
      } else {
        toast.error(`Reclassification failed: ${res.error}`);
      }
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="text-sm font-bold text-foreground">Skipped Articles (Gazetteer &apos;other&apos;)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          These articles did not meet the weight thresholds and were auto-classified as non-relevant.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-xs font-medium">No skipped articles found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {articles.map((item) => {
              const isSelected = selectedArticleId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectArticle(item)}
                  className={`flex flex-wrap items-center justify-between p-3.5 gap-3 transition-colors cursor-pointer ${
                    isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/15"
                  }`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 bg-muted/40 rounded-full">
                        {formatDistanceToNow(new Date(item.processedAt), { addSuffix: true })}
                      </span>
                      <a
                        href={item.rawArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-primary hover:underline font-medium truncate max-w-[200px]"
                      >
                        Source Link
                      </a>
                    </div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {item.rawArticle.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 font-normal leading-relaxed">
                      {item.rawArticle.contentSnippet}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecatModalArticle(item);
                        setSelectedCategory(gazetteerConfig.categories[0] || "");
                      }}
                      variant="outline"
                      size="sm"
                      className="text-[10px] px-2.5 py-1 h-7 font-bold border-primary/20 hover:border-primary/50 text-primary cursor-pointer"
                    >
                      <HugeiconsIcon icon={PlayIcon} className="w-3 h-3 mr-1" />
                      Force
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recategorization Modal */}
      {recatModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={Alert01Icon} className="w-4 h-4 text-warning" />
                Force Classification & Reprocess
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-normal">
                You are manually overriding this article&apos;s category. It will bypass Stage 1 filters and be queued for Stage 2 enrichment immediately.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {recatModalArticle.rawArticle.title}
                </h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                  {recatModalArticle.rawArticle.contentSnippet}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground">
                  Select Target Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs bg-muted/50 border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {gazetteerConfig.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecatModalArticle(null)}
                disabled={isPending}
                className="text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleForceRecat}
                disabled={isPending || !selectedCategory}
                className="text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer"
              >
                {isPending ? "Queuing..." : "Confirm & Reprocess"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
