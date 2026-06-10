"use client";

import { TopicFinding } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import BookmarkButton from "@/components/ui/BookmarkButton";

export function FindingCard({
  finding,
  onSelect,
  onDelete,
}: {
  finding: TopicFinding;
  onSelect: (f: TopicFinding) => void;
  onDelete: (findingId: string) => void;
}) {
  const showNewBadge = !finding.isRead;

  const isReddit = finding.sourceType === "REDDIT";
  const redditMeta = isReddit
    ? (finding.metadata as {
        author?: string;
        subreddit?: string;
        isSelfPost?: boolean;
        externalUrl?: string;
        commentsUrl?: string;
      } | null)
    : null;

  let domain = "";
  if (redditMeta?.externalUrl) {
    try {
      domain = new URL(redditMeta.externalUrl).hostname.replace("www.", "");
    } catch {
      domain = "external link";
    }
  }

  return (
    <div
      className="p-8 rounded-2xl border border-secondary bg-secondary/10 hover:border-primary/40 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 backdrop-blur-sm relative overflow-hidden cursor-pointer"
      onClick={() => onSelect(finding)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(finding);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${finding.title}`}
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {isReddit ? (
              <>
                <span className="font-extrabold text-[#FF4500] bg-[#FF4500]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {redditMeta?.subreddit || "r/Reddit"}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="font-semibold text-muted-foreground/60 truncate max-w-[150px]">
                  posted by u/{redditMeta?.author || "unknown"}
                </span>
                {!redditMeta?.isSelfPost && domain && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#0079D3] bg-[#0079D3]/10 px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap">
                      <HugeiconsIcon icon={LinkSquare02Icon} className="w-2.5 h-2.5" />
                      {domain}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {finding.sourceType}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  {finding.sourceName}
                </span>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(finding.id);
              }}
              className="ml-auto p-1 rounded-lg text-destructive hover:bg-destructive/10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
              title="Delete finding"
            >
              <HugeiconsIcon icon={Delete01Icon} size={12} />
              Delete
            </button>
            <div onClick={(e) => e.stopPropagation()} className="ml-2 z-10 relative cursor-pointer">
              <BookmarkButton type="finding" targetId={finding.id} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold group-hover:text-primary transition-colors leading-tight tracking-tight">
            {finding.title}
          </h3>
          {finding.summary && (
            <p className="text-[15px] text-muted-foreground/90 line-clamp-3 leading-relaxed font-medium tracking-tight">
              {finding.summary}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
          {showNewBadge && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)] animate-pulse">
              New
            </span>
          )}

          {finding.relevanceScore && (
            <div className="flex flex-col items-start md:items-end p-4 rounded-2xl bg-secondary/10 border border-secondary/20 md:min-w-[100px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Signal
              </span>
              <div className="text-3xl font-black text-primary font-mono leading-none tracking-tighter">
                {(finding.relevanceScore * 100).toFixed(0)}
                <span className="text-[10px] ml-0.5 opacity-50">%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
