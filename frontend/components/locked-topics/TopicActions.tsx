"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TopicActionsProps {
  id: string;
  initialActive: boolean;
  unread: number;
}

export function TopicActions({ id, initialActive, unread }: TopicActionsProps) {
  const [active, setActive] = useState(initialActive);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    const previousState = active;
    setActive(checked);

    try {
      const res = await fetch(`/api/locked-topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Tracker ${checked ? "resumed" : "paused"} successfully.`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tracker status.");
      setActive(previousState); // revert on error
    } finally {
      setIsLoading(false);
    }
  };

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
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
}
