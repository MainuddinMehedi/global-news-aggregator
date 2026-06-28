"use client";

import { TopicFinding } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import BookmarkButton from "@/components/bookmarks/BookmarkButton";
import { RelativeTime } from "../ui/RelativeTime";

export function FindingCard({
  finding,
  onDelete,
  onSelect,
}: {
  finding: TopicFinding;
  onDelete: (findingId: string) => void;
  onSelect: (finding: TopicFinding) => void;
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
    <div className="group relative flex flex-col md:flex-row gap-5 p-6 rounded-[2rem] bg-card hover:bg-secondary/5 border border-transparent hover:border-border/50 transition-all duration-300 shadow-sm hover:shadow-md h-full overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-primary/80 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isReddit ? (
                <>
                  <span
                    className="inline-block font-extrabold text-[#FF4500] bg-[#FF4500]/10 px-2.5 py-1 rounded-full whitespace-nowrap truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px] text-[9px]"
                    title={redditMeta?.subreddit || "r/Reddit"}
                  >
                    {redditMeta?.subreddit || "r/Reddit"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                  <span
                    className="inline-block font-semibold text-muted-foreground/60 truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px] text-[10px]"
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
                    className="inline-block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate"
                    title={finding.sourceName}
                  >
                    {finding.sourceName}
                  </span>
                </>
              )}
            </div>

            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              <RelativeTime date={finding.foundAt} />
            </span>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-1 ml-auto shrink-0">
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

          <button
            onClick={() => onSelect(finding)}
            className="text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group/btn mt-1 block"
          >
            <h3 className="text-2xl font-extrabold group-hover/btn:text-primary transition-colors leading-tight tracking-tight">
              {finding.title}
            </h3>

            {finding.summary && (
              <p className="text-[15px] text-muted-foreground/90 line-clamp-3 leading-relaxed font-medium tracking-tight mt-3">
                {finding.summary}
              </p>
            )}
          </button>
        </div>

        <div className="flex flex-col items-end md:items-center gap-3 shrink-0">
          {showNewBadge && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(var(--primary),0.4)] animate-pulse">
              New
            </span>
          )}

          {finding.relevanceScore != null && (
            <div className="flex flex-col items-center justify-center py-3 px-4 rounded-2xl bg-secondary/10 border border-secondary/20 min-w-[90px] text-center mt-auto">
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
