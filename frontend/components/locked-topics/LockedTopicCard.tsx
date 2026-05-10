import { LockedTopic, TopicFinding } from "@/types/lockedTopic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { RssLockedIcon } from "@hugeicons/core-free-icons";
import LockedTopicCardClient from "./LockedTopicCardClient";

interface LockedTopicCardProps {
  topic: LockedTopic;
  latestFindings: TopicFinding[];
}

export default function LockedTopicCard({ topic, latestFindings }: LockedTopicCardProps) {
  const isScanning = !topic.lastScannedAt;
  const unreadCount = 0; // Dynamic in Phase 7

  return (
    <Card className={`h-full flex flex-col gap-2 group transition-all duration-200 border-secondary ${!topic.isActive ? 'opacity-60 grayscale-[0.5]' : 'hover:border-primary/50 shadow-sm'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${topic.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <HugeiconsIcon icon={RssLockedIcon} size={20} />
            </div>
            <div>
              <Link href={`/locked-topics/${topic.id}`}>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                  {topic.displayName}
                </CardTitle>
              </Link>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-tight">
                {topic.matchCount} Matches · Last: {topic.lastMatchedAt ? formatRelativeTime(topic.lastMatchedAt) : 'Never'}
              </p>
            </div>
          </div>
          <LockedTopicCardClient topic={topic} unreadCount={unreadCount} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
          "{topic.aiQuerySummary}"
        </p>

        <div className="space-y-2 mt-auto">
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border pb-1">Latest Findings</h4>
          {isScanning ? (
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          ) : latestFindings.length > 0 ? (
            <ul className="space-y-1.5">
              {latestFindings.map((finding) => (
                <li key={finding.id} className="text-xs flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                  <Link 
                    href={finding.sourceUrl} 
                    target="_blank" 
                    className="hover:underline line-clamp-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {finding.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic py-1">No findings yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
