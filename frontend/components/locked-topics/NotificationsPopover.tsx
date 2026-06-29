"use client";

import { useState, useEffect } from "react";
import { TopicFinding } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { RelativeTime } from "../ui/RelativeTime";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { NotificationDropdownShell } from "@/components/ui/NotificationDropdownShell";

interface NotificationsPopoverProps {
  topicId: string;
  unreadCount: number;
  isActive: boolean;
}

export function NotificationsPopover({
  topicId,
  unreadCount,
  isActive,
}: NotificationsPopoverProps) {
  const [findings, setFindings] = useState<TopicFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const router = useRouter();

  // Sync local count with prop (in case it updates from outside)
  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchFindings = async () => {
      setIsLoading(true);

      try {
        const limit = Math.max(localUnreadCount, 10);
        // Fetch unread findings
        const res = await fetch(
          `/api/locked-topics/${topicId}/findings?unreadOnly=true&limit=${limit}`,
        );
        if (!res.ok) throw new Error("Failed to fetch unread findings");
        const data = await res.json();
        if (isMounted) setFindings(data.findings);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFindings();
    return () => {
      isMounted = false;
    };
  }, [isOpen, topicId, localUnreadCount]);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`/api/locked-topics/${topicId}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark as read");

      toast.success("All findings marked as read");

      setFindings([]);
      setLocalUnreadCount(0);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark findings as read");
    }
  };

  const handleItemClick = async (findingId: string) => {
    try {
      // Optimistically remove
      setLocalUnreadCount((c) => Math.max(0, c - 1));
      setFindings((prev) => prev.filter((f) => f.id !== findingId));

      const res = await fetch(`/api/locked-topics/${topicId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });
      
      if (!res.ok) {
         // If it fails, we should ideally revert, but we'll just log for now
         console.error("Failed to mark finding as read");
      } else {
         router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const trigger = (
    <Button
      variant={localUnreadCount > 0 && isActive ? "secondary" : "ghost"}
      size="icon"
      className={`relative h-9 w-9 rounded-xl transition-colors cursor-pointer ${
        localUnreadCount > 0 && isActive
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-primary"
      }`}
      title="Recent findings"
      onClick={(e) => e.stopPropagation()}
    >
      <HugeiconsIcon icon={Notification01Icon} className="h-4 w-4" />
      {localUnreadCount > 0 && isActive && (
        <Badge
          variant="destructive"
          className="absolute -top-1.5 -right-2 rounded-full px-1.5 text-[10px] bg-destructive/20! [&>svg]:size-2! has-data-[icon=inline-end]:pr-1!"
        >
          {localUnreadCount > 99 ? "99+" : localUnreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <NotificationDropdownShell
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={trigger}
      headerIcon={Notification01Icon}
      headerTitle="Unread Findings"
      onMarkAllRead={handleMarkAllAsRead}
      isLoading={isLoading}
      hasItems={findings.length > 0}
      showClearAll={localUnreadCount > 0}
      footerLinkHref={`/locked-topics/${topicId}?source=ALL&sort=newest`}
      footerLinkLabel={`See All ${localUnreadCount > 0 ? localUnreadCount : ""} Findings`}
    >
      {findings.map((finding) => (
        <div
          key={finding.id}
          onClick={() => handleItemClick(finding.id)}
          className="p-4 hover:bg-secondary/10 transition-colors group cursor-pointer select-none"
        >
          <div className="block space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/70">
                {finding.sourceType}
              </span>
              <RelativeTime
                date={finding.foundAt}
                className="text-[8px] font-bold text-muted-foreground/50 uppercase"
              />
            </div>
            <h4 className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {finding.title}
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
              {finding.sourceName}
            </p>
          </div>
        </div>
      ))}
    </NotificationDropdownShell>
  );
}
