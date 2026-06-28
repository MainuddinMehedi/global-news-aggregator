import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const getStatusBadge = (status: string, heartbeatAt?: Date) => {
  if (status === "RUNNING") {
    // Check if heartbeat is stale (older than 2 minutes)
    const isStale = heartbeatAt
      ? Date.now() - new Date(heartbeatAt).getTime() > 2 * 60 * 1000
      : false;

    if (isStale) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          STALE HEARTBEAT
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        RUNNING
      </span>
    );
  }

  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
        SUCCESS
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
      FAILED
    </span>
  );
};

export const formatTaskName = (name: string) => {
  const mapping: Record<string, string> = {
    "rss-ingestion": "RSS Feeds Ingestion",
    "story-clustering": "Story Clustering",
    "locked-topic-scan": "Locked Topic Surveillance",
    "backlog-processing": "Backlog LLM Processing",
  };
  return mapping[name] || name;
};

export const formatDuration = (start: Date, end: Date | null) => {
  if (!end) return "-";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}m ${remainingSecs}s`;
};

export const formatMetadata = (taskName: string, metadata: any) => {
  if (!metadata) return "-";
  try {
    if (taskName === "rss-ingestion") {
      return `Fetched: ${metadata.fetchedCount || 0} | Inserted: ${metadata.insertedCount || 0} | Dupes: ${metadata.dupeCount || 0}`;
    }
    if (taskName === "story-clustering") {
      return `Groups: ${metadata.groupsFound || 0} | Archived: ${metadata.archivedCount || 0}`;
    }
    if (taskName === "locked-topic-scan") {
      return `Scanned: ${metadata.topicsScanned || 0} | Findings: ${metadata.findingsCount || 0}`;
    }
    if (taskName === "backlog-processing") {
      return `Processed: ${metadata.processedCount || 0} | Skipped: ${metadata.skippedCount || 0}`;
    }
    return JSON.stringify(metadata);
  } catch {
    return JSON.stringify(metadata);
  }
};
