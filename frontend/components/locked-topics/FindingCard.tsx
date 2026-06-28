"use client";

import { TopicFinding } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import BookmarkButton from "@/components/bookmarks/BookmarkButton";
import { FindingDetailsModal } from "./FindingDetailsModal";

export function FindingCard({
  finding,
  onDelete,
}: {
  finding: TopicFinding;
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
    <div className="p-8 rounded-2xl border border-secondary bg-secondary/10 hover:border-primary/40 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 backdrop-blur-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 text-[10px] w-full min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isReddit ? (
                <>
                  <span
                    className="inline-block font-extrabold text-[#FF4500] bg-[#FF4500]/10 px-2.5 py-1 rounded-full whitespace-nowrap truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px]"
                    title={redditMeta?.subreddit || "r/Reddit"}
                  >
                    {redditMeta?.subreddit || "r/Reddit"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                  <span
                    className="inline-block font-semibold text-muted-foreground/60 truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px]"
                    title={`posted by u/${redditMeta?.author || "unknown"}`}
                  >
                    posted by u/{redditMeta?.author || "unknown"}
                  </span>
                  {!redditMeta?.isSelfPost && domain && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                      <span
                        className="inline-flex items-center gap-1 font-extrabold text-[#0079D3] bg-[#0079D3]/10 px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap truncate max-w-[100px] sm:max-w-[130px] md:max-w-[160px]"
                        title={domain}
                      >
                        <HugeiconsIcon
                          icon={LinkSquare02Icon}
                          className="w-2.5 h-2.5 shrink-0"
                        />
                        <span className="truncate">{domain}</span>
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                    {finding.sourceType}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                  <span
                    className="inline-block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 truncate"
                    title={finding.sourceName}
                  >
                    {finding.sourceName}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(finding.id);
                }}
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center justify-center cursor-pointer"
                title="Delete finding"
              >
                <HugeiconsIcon icon={Delete01Icon} size={14} />
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                className="z-10 relative cursor-pointer"
              >
                <BookmarkButton type="finding" targetId={finding.id} />
              </div>
            </div>
          </div>

          <FindingDetailsModal
            finding={finding}
            onDelete={async () => onDelete(finding.id)}
          />
        </div>

        <div className="flex flex-col items-end md:items-center gap-3 shrink-0">
          {showNewBadge && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)] animate-pulse">
              New
            </span>
          )}

          {finding.relevanceScore && (
            <div className="flex flex-col items-center justify-center py-3 px-4 rounded-2xl bg-secondary/10 border border-secondary/20 min-w-[90px] text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 text-center w-full block">
                Signal
              </span>
              <div className="text-3xl font-black text-primary font-mono leading-none tracking-tighter flex items-baseline justify-center w-full">
                <span>{(finding.relevanceScore * 100).toFixed(0)}</span>
                <span className="text-[10px] ml-0.5 opacity-50 font-sans">
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
