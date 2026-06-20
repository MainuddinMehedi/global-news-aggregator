"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, RefreshIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { resetAllFeedFailures, triggerManualIngestion } from "@/app/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SourceControlStripProps {
  onAddClick: () => void;
}

export default function SourceControlStrip({ onAddClick }: SourceControlStripProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleResetAll = () => {
    if (!confirm("Are you sure you want to reset failure counts for all feeds?")) return;
    startTransition(async () => {
      const res = await resetAllFeedFailures();
      if (res.success) {
        toast.success("All feed failure counts reset.");
        router.refresh();
      } else {
        toast.error(`Failed to reset: ${res.error}`);
      }
    });
  };

  const handleTriggerIngest = () => {
    startTransition(async () => {
      const res = await triggerManualIngestion();
      if (res.success) {
        toast.success("Manual ingestion crawl queued successfully.");
        toast.info("Switch to 'System Health & Tasks' tab to observe execution.");
        router.refresh();
      } else {
        toast.error(`Failed to queue: ${res.error}`);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-border/50 bg-card/45 backdrop-blur-md rounded-2xl gap-4 shadow-sm">
      <div className="space-y-0.5">
        <h3 className="text-lg font-bold tracking-tight text-foreground font-semibold">
          Source Control Center
        </h3>
        <p className="text-xs text-muted-foreground font-medium">
          Manage geopolitical news feed sources and trigger crawler updates.
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button
          onClick={handleResetAll}
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-2 text-xs font-semibold"
        >
          <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5" />
          Reset All Failure Counts
        </Button>
        <Button
          onClick={handleTriggerIngest}
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-2 text-xs font-semibold border-primary/30 hover:border-primary/60 text-primary"
        >
          <HugeiconsIcon icon={PlayIcon} className="w-3.5 h-3.5" />
          {isPending ? "Queuing Ingest..." : "Trigger Ingestion"}
        </Button>
        <Button
          onClick={onAddClick}
          size="sm"
          disabled={isPending}
          className="gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <HugeiconsIcon icon={Add01Icon} className="w-3.5 h-3.5" />
          Add New Source
        </Button>
      </div>
    </div>
  );
}
