"use client";

import { useState, useTransition } from "react";
import { FailedEnrichmentData } from "@/queries/admin/skipped";
import { retryFailedEnrichments, discardFailedEnrichments } from "@/app/actions/admin/enrichment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon, Delete01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { formatDistanceToNow } from "date-fns";

interface FailedEnrichmentsTableProps {
  articles: FailedEnrichmentData[];
}

export default function FailedEnrichmentsTable({ articles }: FailedEnrichmentsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === articles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(articles.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRetrySelected = () => {
    if (selectedIds.length === 0) return;
    
    startTransition(async () => {
      const res = await retryFailedEnrichments(selectedIds);
      if (res.success) {
        toast.success(`Queued ${selectedIds.length} failed articles for reprocessing.`);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(`Failed to retry: ${res.error}`);
      }
    });
  };

  const handleDiscardSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to discard ${selectedIds.length} failed articles? they will be set to skipped.`)) return;

    startTransition(async () => {
      const res = await discardFailedEnrichments(selectedIds);
      if (res.success) {
        toast.success(`Discarded ${selectedIds.length} articles (auto-categorized as skipped).`);
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(`Failed to discard: ${res.error}`);
      }
    });
  };

  return (
    <div className="relative flex flex-col h-full bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      {/* Top Header Control Strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-border/50 bg-muted/20 gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Failed Enrichment Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Articles that failed generative enrichment (e.g. rate limits, LLM offline, script error).
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full shrink-0">
              {selectedIds.length} Selected
            </span>
            <Button
              onClick={handleRetrySelected}
              disabled={isPending}
              size="sm"
              className="text-[10px] px-2.5 py-1 h-7 font-bold bg-primary hover:bg-primary/95 text-primary-foreground gap-1.5 cursor-pointer"
            >
              <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5" />
              Retry Selected
            </Button>
            <Button
              onClick={handleDiscardSelected}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="text-[10px] px-2.5 py-1 h-7 font-bold border-red-500/20 text-red-500 hover:bg-red-500/5 cursor-pointer"
            >
              <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5 mr-1" />
              Discard
            </Button>
          </div>
        )}
      </div>

      {/* Articles Table/List */}
      <div className="flex-1 overflow-auto max-h-[450px]">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-xs font-medium">No failed enrichments found in queue.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/10 text-muted-foreground font-bold text-[10px] uppercase">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === articles.length && articles.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-border/80 focus:ring-primary focus:ring-offset-background accent-primary cursor-pointer"
                  />
                </th>
                <th className="p-3">Source & Title</th>
                <th className="p-3 w-32">Model Attempt</th>
                <th className="p-3 w-32 text-right">Failed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {articles.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-muted/10 ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-border/80 focus:ring-primary focus:ring-offset-background accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                            {item.rawArticle.source}
                          </span>
                          <a
                            href={item.rawArticle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            Source Url
                          </a>
                        </div>
                        <h4 className="font-bold text-foreground line-clamp-1">
                          {item.rawArticle.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {item.rawArticle.contentSnippet}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground font-medium text-[11px]">
                      {item.model || "Unknown"}
                    </td>
                    <td className="p-3 text-right text-muted-foreground text-[10px] font-semibold whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.processedAt), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
