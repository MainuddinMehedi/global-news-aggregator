"use client";

import { ExtractableContent } from "@/components/locked-topics/findings/ExtractableContent";
import { autoFormatPlainText } from "@/lib/locked-topics/api";
import { TopicFinding } from "@/types/lockedTopic";

interface RedditContentProps {
  finding: TopicFinding;
}

export function RedditContent({ finding }: RedditContentProps) {
  const meta = finding.metadata as {
    isSelfPost?: boolean;
    externalUrl?: string;
    commentsUrl?: string;
    contentHtml?: string;
  } | null;

  const isSelfPost = meta?.isSelfPost !== false;

  if (isSelfPost) {
    const htmlContent =
      meta?.contentHtml ||
      autoFormatPlainText(finding.title, finding.summary || "");

    return (
      <div className="space-y-4">
        <div className="article-prose max-w-none p-6 rounded-xl border border-secondary bg-secondary/5">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    );
  }

  const externalUrl = meta?.externalUrl || finding.sourceUrl;
  const linkFinding = {
    ...finding,
    sourceUrl: externalUrl,
  };

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-xl border border-[#0079D3]/20 bg-[#0079D3]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0079D3]">
            Reddit Link Post
          </p>
          <p className="text-sm text-muted-foreground truncate max-w-[320px] sm:max-w-[450px]">
            Links directly to:{" "}
            <span className="font-semibold text-foreground">{externalUrl}</span>
          </p>
        </div>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center justify-center rounded-lg text-xs font-bold bg-[#0079D3] text-white hover:bg-[#0079D3]/95 h-8 px-4"
        >
          Visit Site
        </a>
      </div>
      <ExtractableContent finding={linkFinding} />
    </div>
  );
}
