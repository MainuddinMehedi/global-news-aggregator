"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export function TelemetryRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      toast.success("Telemetry logs reloaded.");
    });
  };

  return (
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isPending}
      className="gap-2 text-xs font-semibold"
    >
      <HugeiconsIcon
        icon={RefreshIcon}
        className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Refreshing..." : "Refresh Status"}
    </Button>
  );
}
