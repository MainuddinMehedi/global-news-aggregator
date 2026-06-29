"use client";

import { useState } from "react";

import { TopicFinding } from "@/types/lockedTopic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import FindingContentSection from "@/components/locked-topics/findings/FindingContentSection";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { RelativeTime } from "@/components/ui/RelativeTime";

interface FindingDetailsModalProps {
  finding: TopicFinding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}

export function FindingDetailsModal({
  finding,
  open,
  onOpenChange,
  onDelete,
}: FindingDetailsModalProps) {
  if (!finding) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-208 max-h-[85vh] flex-col overflow-y-auto p-0 rounded-lg border border-border/50 shadow-2xl no-scrollbar">
        <DialogHeader className="px-5 py-4 border-b border-border/50 shrink-0">
          {/*Metadata part*/}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {finding.sourceType === "REDDIT" ? (
              <>
                <span className="font-extrabold text-[#FF4500] bg-[#FF4500]/10 px-2.5 py-1 rounded-full text-[9px]">
                  {(finding.metadata as any)?.subreddit || "r/Reddit"}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs text-muted-foreground font-semibold">
                  posted by u/{(finding.metadata as any)?.author || "unknown"}
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {finding.sourceType}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs text-muted-foreground font-medium">
                  {finding.sourceName}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground font-medium">
              <RelativeTime date={finding.foundAt} />
            </span>
            {finding.relevanceScore != null && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs font-bold text-primary font-mono">
                  Signal {(finding.relevanceScore * 100).toFixed(0)}%
                </span>
              </>
            )}
          </div>

          <DialogTitle className="text-xl font-bold leading-snug text-foreground pr-8 text-left">
            {finding.title}
          </DialogTitle>

          {(() => {
            const isRedditSelfPost =
              finding.sourceType === "REDDIT" &&
              (finding.metadata as any)?.isSelfPost !== false;
            if (finding.summary && !isRedditSelfPost) {
              return (
                <p className="text-[15px] text-muted-foreground/90 leading-relaxed mt-1 text-left">
                  {finding.summary}
                </p>
              );
            }
            return null;
          })()}

          <DialogDescription className="sr-only">
            Detailed view of finding: {finding.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 bg-card">
          <FindingContentSection finding={finding} />
        </div>

        <div className="p-4 border-t border-border/50 backdrop-blur-sm shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={async () => {
              await onDelete();
              onOpenChange(false);
            }}
            className="flex w-full sm:w-auto items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none bg-destructive/10 text-destructive hover:bg-destructive/20 h-9 px-4 gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Delete01Icon} className="w-4 h-4" />
            Delete Finding
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {finding.sourceType === "REDDIT" &&
            !(finding.metadata as any)?.isSelfPost &&
            (finding.metadata as any)?.externalUrl ? (
              <>
                <a
                  href={finding.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 gap-2 border border-border"
                >
                  <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
                  Reddit Discussion
                </a>
                <a
                  href={(finding.metadata as any).externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
                >
                  <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
                  Open Linked Article
                </a>
              </>
            ) : (
              <a
                href={finding.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
              >
                <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
                Open Original
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
