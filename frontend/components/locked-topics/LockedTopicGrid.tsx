import { LockedTopic, TopicFinding } from "@/types/lockedTopic";
import LockedTopicCard from "./LockedTopicCard";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, RssLockedIcon } from "@hugeicons/core-free-icons";

import CreateTopicModal from "./CreateTopicModal";

interface LockedTopicGridProps {
  topics: LockedTopic[];
  latestFindingsMap: Record<string, TopicFinding[]>;
}

export default function LockedTopicGrid({
  topics,
  latestFindingsMap,
}: LockedTopicGridProps) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground/20">
          <HugeiconsIcon icon={RssLockedIcon} size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            No locked topics yet
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Create persistent trackers for specific investigative themes, career
            opportunities, or geopolitical events.
          </p>
        </div>
        <CreateTopicModal
          trigger={
            <Button
              size="lg"
              className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <HugeiconsIcon icon={Add01Icon} size={20} />
              Lock New Topic
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {topics.map((topic) => (
        <LockedTopicCard
          key={topic.id}
          topic={topic}
          latestFindings={latestFindingsMap[topic.id] || []}
        />
      ))}
    </div>
  );
}
