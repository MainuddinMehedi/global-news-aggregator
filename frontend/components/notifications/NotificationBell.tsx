"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bell, Tick01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "./NotificationItem";
import { Notification } from "@news/db";

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

  // 2. Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecentNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=5");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch recent notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentNotifications();
  }, [isOpen]);

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
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleItemClick = async (id: string) => {
    try {
      // Mark as read immediately on click
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });

      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 rounded-2xl border-secondary shadow-2xl overflow-hidden"
        align="end"
      >
        <div className="p-4 border-b border-secondary bg-secondary/5 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <HugeiconsIcon icon={Bell} size={16} className="text-primary" />
            Notifications
          </h3>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={handleMarkAllRead}
            >
              <HugeiconsIcon icon={Tick01Icon} size={14} className="mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[350px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-1/2 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-secondary/30">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleItemClick(n.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto text-muted-foreground/30">
                <HugeiconsIcon icon={Tick01Icon} size={24} />
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 italic">
                All caught up!
              </p>
            </div>
          )}
        </ScrollArea>

        <Link
          href="/notifications"
          className="block p-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/10 hover:text-primary transition-all border-t border-secondary"
          onClick={() => setIsOpen(false)}
        >
          See All Notifications
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="inline-block ml-1" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
