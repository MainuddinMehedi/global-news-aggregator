'use client';

import { LockedTopic } from "@/types/lockedTopic";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TopicActiveToggleProps {
  topic: LockedTopic;
}

export default function TopicActiveToggle({ topic }: TopicActiveToggleProps) {
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
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <Switch 
        checked={isActive} 
        onCheckedChange={toggleActive}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
