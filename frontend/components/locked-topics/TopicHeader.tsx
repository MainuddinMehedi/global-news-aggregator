import { LockedTopic } from "@/types/lockedTopic";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RssLockedIcon,
  Settings01Icon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TopicHeader({ topic }: { topic: LockedTopic }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/locked-topics"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Locked Topics
              </Link>
              <span className="text-muted-foreground/30 text-xs">/</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                {topic.displayName}
              </span>
            </div>
            {topic.isActive && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                  Live Monitoring
                </span>
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
            {topic.displayName}
            {!topic.isActive && (
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground"
              >
                Archived
              </Badge>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-secondary h-10 px-4"
          >
            <HugeiconsIcon icon={Settings01Icon} size={16} />
            <span className="hidden sm:inline">Edit Tracker</span>
          </Button>
          <Button
            size="sm"
            className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-10 px-5 font-bold"
          >
            <HugeiconsIcon icon={RssLockedIcon} size={16} />
            Scan Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-2xl bg-secondary/10 border border-secondary/50 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary">
            <HugeiconsIcon icon={SparklesIcon} size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              AI Intelligence Report
            </span>
          </div>
          <p className="text-lg leading-relaxed text-foreground/90 font-medium italic">
            "{topic.aiQuerySummary}"
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            {topic.sources.map((s, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-background/40 border-secondary text-[9px] uppercase font-bold py-1 px-2 tracking-wider"
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Search01Icon} size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Search Strategy
              </span>
            </div>
            <div className="font-mono text-[11px] bg-background/40 p-3 rounded-xl border border-primary/10 overflow-x-auto whitespace-nowrap leading-none">
              {topic.aiRefinedQuery}
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
            <span>Matches: {topic.matchCount}</span>
            <span>
              Last Scan:{" "}
              {topic.lastScannedAt
                ? formatRelativeTime(topic.lastScannedAt.toString())
                : "Never"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
