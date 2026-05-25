'use client';

import { LockedTopic } from "@/types/lockedTopic";
import { Switch } from "@/components/ui/switch";
import { Bell } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LockedTopicCardClientProps {
  topic: LockedTopic;
  unreadCount: number;
}

export default function LockedTopicCardClient({ topic, unreadCount }: LockedTopicCardClientProps) {
  const [isActive, setIsActive] = useState(topic.isActive);
  const [isScanning, setIsScanning] = useState(!topic.lastScannedAt);
  const router = useRouter();

  // Polling for initial scan status
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/locked-topics/${topic.id}/status`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.lastScannedAt) {
          setIsScanning(false);
          router.refresh();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isScanning, topic.id, router]);

  const toggleActive = async () => {
    const previousState = isActive;
    const newState = !isActive;
    setIsActive(newState); // Optimistic UI

    try {
      const res = await fetch(`/api/locked-topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newState }),
      });

      if (!res.ok) throw new Error();
      toast.success(newState ? "Topic activated" : "Topic archived");
      router.refresh();
    } catch (error) {
      setIsActive(previousState);
      toast.error("Failed to update topic status");
    }
  };

  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <div className="relative cursor-pointer text-muted-foreground hover:text-primary transition-colors">
        <HugeiconsIcon icon={Bell} size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
            {unreadCount}
          </span>
        )}
      </div>
      <Switch 
        checked={isActive} 
        onCheckedChange={toggleActive}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
