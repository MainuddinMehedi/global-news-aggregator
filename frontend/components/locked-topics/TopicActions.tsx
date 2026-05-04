"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface TopicActionsProps {
  id: string;
  initialActive: boolean;
  unread: number;
}

export function TopicActions({ id, initialActive, unread }: TopicActionsProps) {
  const [active, setActive] = useState(initialActive);

  // Note: Toggling this only updates local state for now.
  // When hooked up to the DB, this will trigger a Server Action or API call.
  return (
    <div className="flex items-center gap-4">
      <Button
        variant={unread > 0 && active ? "secondary" : "ghost"}
        size="icon"
        className={`relative h-9 w-9 rounded-xl transition-colors ${
          unread > 0 && active
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Notifications"
      >
        <HugeiconsIcon icon={Notification01Icon} className="h-4 w-4" />
        {unread > 0 && active && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
            {unread}
          </span>
        )}
      </Button>

      <Switch
        checked={active}
        onCheckedChange={(checked) => setActive(checked)}
      />
    </div>
  );
}
