"use client";

import { TopicFinding } from "@/types/lockedTopic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FindingContentSection from "./FindingContentSection";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { RelativeTime } from "@/components/ui/RelativeTime";

interface FindingDetailsModalProps {
  finding: TopicFinding | null;
  onClose: () => void;
}

export function FindingDetailsModal({
  finding,
  onClose,
}: FindingDetailsModalProps) {
  if (!finding) return null;

  return (
    <Dialog
      open={!!finding}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[52rem] max-h-[85vh] flex-col overflow-y-auto p-0 rounded-lg border border-border/50 shadow-2xl no-scrollbar">
        <DialogHeader className="px-5 py-4 border-b border-border/50 shrink-0">
          {/*Metadata part*/}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {finding.sourceType}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground font-medium">
              {finding.sourceName}
            </span>
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

          {finding.summary && (
            <p className="text-[15px] text-muted-foreground/90 leading-relaxed mt-1">
              {finding.summary}
            </p>
          )}

          <DialogDescription className="sr-only">
            Detailed view of finding: {finding.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 bg-card">
          <FindingContentSection finding={finding} />
        </div>

        <div className="p-4 border-t border-border/50 backdrop-blur-sm shrink-0 flex justify-end">
          <a
            href={finding.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 gap-2"
          >
            <HugeiconsIcon icon={LinkSquare02Icon} className="w-4 h-4" />
            Open Original
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
