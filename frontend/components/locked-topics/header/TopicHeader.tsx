import { ScanNowButton } from "@/components/locked-topics/header/ScanNowButton";
import TopicActiveToggle from "@/components/locked-topics/header/TopicActiveToggle";
import { ClearFindingsModal } from "@/components/locked-topics/modals/ClearFindingsModal";
import CreateTopicModal from "@/components/locked-topics/modals/CreateTopicModal/CreateTopicModal";
import { DeleteTopicModal } from "@/components/locked-topics/modals/DeleteTopicModal";
import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { CreateTopicData, LockedTopic } from "@/types/lockedTopic";
import { Search01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

export default function TopicHeader({ topic }: { topic: LockedTopic }) {
  const initialData: CreateTopicData = {
    displayName: topic.displayName,
    userContext: topic.userContext,
    sources: topic.sources,
    aiRefinedQuery: topic.aiRefinedQuery,
    aiQuerySummary: topic.aiQuerySummary,
    conceptualKeywords: topic.conceptualKeywords,
    suggestedSources: [],
    notifyEnabled: topic.notifyEnabled,
    notifyMode: topic.notifyMode,
    notifyChannels: topic.notifyChannels as {
      discord: boolean;
      telegram: boolean;
    },
  };

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

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3">
            {topic.displayName}

            {!topic.isActive && (
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground rounded-full px-3"
              >
                Archived
              </Badge>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/*notification icon and on/off switch*/}
          <TopicActiveToggle topic={topic} />

          <div className="h-6 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-2">
            <ClearFindingsModal
              topicId={topic.id}
              topicName={topic.displayName}
            />

            <DeleteTopicModal
              topicId={topic.id}
              topicName={topic.displayName}
            />
          </div>

          <CreateTopicModal topicId={topic.id} initialData={initialData} />

          <ScanNowButton topicId={topic.id} />
        </div>
      </div>

      {/*AI intelligence report*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-2xl bg-secondary/30 border border-secondary/50 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary">
            <HugeiconsIcon icon={SparklesIcon} size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              AI Intelligence Report
            </span>
          </div>

          <p className="text-lg leading-relaxed text-foreground/90 font-medium">
            &quot;{topic.aiQuerySummary}&quot;
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            {topic.sources.map((s, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[10px] font-semibold py-1 px-2 tracking-widest"
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {/*Search strategy And Last scanned at, match count*/}
        <div className="p-6 rounded-2xl bg-muted/20 border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Search01Icon} size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Search Strategy
              </span>
            </div>
            <div className="font-mono text-[10px] bg-background/50 p-4 rounded-2xl border border-border leading-relaxed text-wrap break-all opacity-80">
              {topic.aiRefinedQuery}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-border" />
              Matches: {topic.matchCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-border" />
              Last Scan:{" "}
              {topic.lastScannedAt ? (
                <RelativeTime date={topic.lastScannedAt.toString()} />
              ) : (
                "Never"
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
