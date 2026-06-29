"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bell } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "./NotificationItem";
import { Notification } from "@news/db";
import { NotificationDropdownShell } from "@/components/ui/NotificationDropdownShell";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // 1. Poll for unread count with backoff
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const baseDelay = 30000; // 30s
    const maxDelay = 300000; // 5 min
    let currentDelay = baseDelay;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
          currentDelay = baseDelay; // reset backoff on success
        } else {
          currentDelay = Math.min(currentDelay * 2, maxDelay);
        }
      } catch (err) {
        console.error("Failed to poll unread count:", err);
        currentDelay = Math.min(currentDelay * 2, maxDelay);
      } finally {
        timeoutId = setTimeout(fetchUnreadCount, currentDelay);
      }
    };

    fetchUnreadCount();

    return () => clearTimeout(timeoutId);
  }, []);

  // 2. Fetch unread notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecentNotifications = async () => {
      setIsLoading(true);
      try {
        const limit = Math.max(unreadCount, 10);
        const res = await fetch(`/api/notifications?unreadOnly=true&limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentNotifications();
  }, [isOpen, unreadCount]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (!res.ok) throw new Error();

      toast.success("All notifications marked as read");
      setUnreadCount(0);
      setNotifications([]); // Clear list since it's an unread inbox
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleItemClick = async (id: string, url?: string) => {
    try {
      // Optimistically remove it
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });

      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const trigger = (
    <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer select-none">
      <HugeiconsIcon icon={Bell} className="w-5 h-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold bg-destructive text-destructive-foreground animate-pulse leading-none flex items-center justify-center border border-background scale-90"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </button>
  );

  return (
    <NotificationDropdownShell
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={trigger}
      headerIcon={Bell}
      headerTitle="Notifications"
      onMarkAllRead={handleMarkAllRead}
      isLoading={isLoading}
      hasItems={notifications.length > 0}
      showClearAll={unreadCount > 0}
      footerLinkHref="/notifications"
      footerLinkLabel="See All Notifications"
    >
      {notifications.map((n) => {
        // Safe access to payload using Type Assertion or optional chaining
        const payload = n.payload as { url?: string } | null;
        return (
          <NotificationItem
            key={n.id}
            notification={n}
            onClick={() => handleItemClick(n.id, payload?.url)}
          />
        );
      })}
    </NotificationDropdownShell>
  );
}
