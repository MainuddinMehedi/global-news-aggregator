"use client";

import { Button } from "@/components/ui/button";
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface FeedErrorProps {
  message: string;
}

export default function FeedError({ message }: FeedErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-destructive/5 rounded-3xl border border-destructive/10">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <HugeiconsIcon
          icon={Alert02Icon}
          className="text-destructive w-6 h-6"
        />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Unable to load feed
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{message}</p>
      <Button
        onClick={() => window.location.reload()}
        variant="default"
        className="rounded-full px-6"
      >
        <HugeiconsIcon icon={RefreshIcon} className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}
