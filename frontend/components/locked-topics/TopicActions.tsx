"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TopicActionsProps {
  id: string;
  initialActive: boolean;
}

export function TopicActions({ id, initialActive }: TopicActionsProps) {
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
    <div className="flex items-center">
      {/*On/Off switch*/}
      <Switch
        checked={active}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
}
