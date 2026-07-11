import LockedTopicCard from "@/components/locked-topics/grid/LockedTopicCard";
import CreateTopicModal from "@/components/locked-topics/modals/CreateTopicModal/CreateTopicModal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LockedTopic, TopicFinding } from "@/types/lockedTopic";
import { Add01Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface LockedTopicGridProps {
  topics: LockedTopic[];
  latestFindingsMap: Record<string, TopicFinding[]>;
  unreadCountsMap: Record<string, number>;
  isAuthenticated?: boolean;
}

export default function LockedTopicGrid({
  topics,
  latestFindingsMap,
  unreadCountsMap,
  isAuthenticated,
}: LockedTopicGridProps) {
  if (topics.length === 0) {
    return (
      <EmptyState
        icon={Task01Icon}
        title="No Tracking Topics"
        description="Create a locked topic to automatically track, scan, and summarize news matching your specific criteria over time."
        authRequired={!isAuthenticated}
        signInText="Sign in to start tracking"
        action={
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
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {topics.map((topic) => (
        <LockedTopicCard
          key={topic.id}
          topic={topic}
          latestFindings={latestFindingsMap[topic.id] || []}
          unreadCount={unreadCountsMap[topic.id] || 0}
        />
      ))}
    </div>
  );
}
