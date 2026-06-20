"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Edit01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { toggleFeedSource, resetFeedFailures, deleteFeedSource } from "@/app/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface FeedSourceTableProps {
  feedSources: any[];
  onEditClick: (source: any) => void;
}

export default function FeedSourceTable({ feedSources, onEditClick }: FeedSourceTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentVal: boolean) => {
    startTransition(async () => {
      const res = await toggleFeedSource(id, !currentVal);
      if (res.success) {
        toast.success("Feed status updated.");
        router.refresh();
      } else {
        toast.error(`Failed to update feed: ${res.error}`);
      }
    });
  };

  const handleResetFailures = (id: string) => {
    startTransition(async () => {
      const res = await resetFeedFailures(id);
      if (res.success) {
        toast.success("Feed failure count reset.");
        router.refresh();
      } else {
        toast.error(`Failed to reset: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete feed "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteFeedSource(id);
      if (res.success) {
        toast.success("Feed source deleted.");
        router.refresh();
      } else {
        toast.error(`Failed to delete feed: ${res.error}`);
      }
    });
  };

  return (
    <Card className="bg-card/45 border-border/50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <div>
          <h3 className="font-bold text-sm text-foreground">Registered RSS Feeds</h3>
          <p className="text-xs text-muted-foreground">List of active geopolitical feeds crawled by background tasks.</p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap shrink-0">
          {feedSources.length} Feeds
        </span>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/30 text-muted-foreground font-semibold">
                <th className="px-5 py-3">Source Name & Profile</th>
                <th className="px-5 py-3">Feed URL</th>
                <th className="px-5 py-3">Geography & Type</th>
                <th className="px-5 py-3">Failures</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {feedSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground italic">
                    No registered RSS feed sources found in the database.
                  </td>
                </tr>
              ) : (
                feedSources.map((source) => {
                  const hasFailures = source.fetchFailures > 0;
                  return (
                    <tr key={source.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3.5 space-y-1.5 max-w-xs">
                        <div className="font-bold text-foreground truncate">{source.name}</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                            {source.biasGroup}
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-150 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            {source.sourceType}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-muted-foreground max-w-sm truncate">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">
                          {source.url}
                        </a>
                      </td>
                      <td className="px-5 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/80">{source.sourceCountry}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{source.coverageScope}</span>
                        </div>
                        {source.lastFetchedAt && (
                          <div className="text-[9px] text-muted-foreground">
                            Last crawl: {formatDistanceToNow(new Date(source.lastFetchedAt))} ago
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono px-2 py-0.5 rounded-full ${
                            hasFailures 
                              ? "bg-destructive/15 text-destructive animate-pulse" 
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            {source.fetchFailures}
                          </span>
                          {hasFailures && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              onClick={() => handleResetFailures(source.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              title="Reset fail counter"
                            >
                              <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Switch
                          checked={source.enabled}
                          disabled={isPending}
                          onCheckedChange={() => handleToggle(source.id, source.enabled)}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => onEditClick(source)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Edit Feed"
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleDelete(source.id, source.name)}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Feed"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
