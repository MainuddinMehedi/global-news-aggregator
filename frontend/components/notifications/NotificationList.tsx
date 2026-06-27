"use client";

import { useState, useEffect, useRef } from "react";
import { Notification, NotificationType } from "@news/db";
import { NotificationItem } from "./NotificationItem";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  FilterIcon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface NotificationListProps {
  initialNotifications: Notification[];
  initialTotal: number;
  initialHasMore: boolean;
}

export function NotificationList({
  initialNotifications,
  initialTotal,
  initialHasMore,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [page, setPage] = useState<number>(1);
  
  // Filters
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const isMounted = useRef(false);

  // Reset page and fetch new lists when filters change
  useEffect(() => {
    // Skip on mount
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const controller = new AbortController();

    const applyFilters = async () => {
      setPage(1);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", "1");
        queryParams.set("limit", "20");
        if (unreadOnly) queryParams.set("unreadOnly", "true");
        if (filterType !== "ALL") queryParams.set("type", filterType);

        const res = await fetch(`/api/notifications?${queryParams.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setHasMore(data.hasMore);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch filtered notifications:", err);
      }
    };

    applyFilters();

    return () => {
      controller.abort();
    };
  }, [unreadOnly, filterType]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", nextPage.toString());
      queryParams.set("limit", "20");
      if (unreadOnly) queryParams.set("unreadOnly", "true");
      if (filterType !== "ALL") queryParams.set("type", filterType);

      const res = await fetch(`/api/notifications?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => [...prev, ...data.notifications]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleItemClick = async (id: string) => {
    // Find notification locally to check if already read
    const target = notifications.find((n) => n.id === id);
    if (!target || target.readAt) return;

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });

      // Update state locally
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.readAt);
    if (unreadNotifications.length === 0) return;

    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (!res.ok) throw new Error();

      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const notificationTypes = [
    { value: "ALL", label: "All Alert Types" },
    { value: "PIPELINE_FAILURE", label: "Pipeline Failures" },
    { value: "INGESTION_STALLED", label: "Ingestion Stalls" },
    { value: "HIGH_FAILURE_RATE", label: "High Failure Rates" },
    { value: "AI_PROVIDER_DEGRADED", label: "AI Provider Degradations" },
    { value: "REVALIDATION_FAILED", label: "Cache Failures" },
    { value: "TOPIC_FINDING_ALERT", label: "Topic Findings" },
    { value: "TOPIC_SOURCE_DEGRADED", label: "Topic Source Degradations" },
    { value: "STORY_BREAKING", label: "Breaking Stories" },
    { value: "STORY_ESCALATING", label: "Escalating Stories" },
  ];

  return (
    <div className="space-y-6">
      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card/30 border border-border/40 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Type Select */}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={FilterIcon} size={16} className="text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-muted text-foreground text-xs font-bold rounded-xl px-3 py-2 border-0 outline-hidden hover:bg-muted/80 cursor-pointer transition-colors"
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unread Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="unread-only-toggle"
              checked={unreadOnly}
              onCheckedChange={setUnreadOnly}
              className="cursor-pointer"
            />
            <Label htmlFor="unread-only-toggle" className="text-xs font-bold text-muted-foreground select-none cursor-pointer">
              Unread Only
            </Label>
          </div>
        </div>

        {/* Action Button */}
        {notifications.some((n) => !n.readAt) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="w-full sm:w-auto text-xs font-bold rounded-xl cursor-pointer hover:bg-accent/40"
          >
            <HugeiconsIcon icon={Tick01Icon} size={14} className="mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <Card className="divide-y divide-border/30 overflow-hidden rounded-2xl border bg-card/10 backdrop-blur-xs">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => handleItemClick(n.id)}
            />
          ))}
        </Card>
      ) : (
        <div className="py-16 text-center space-y-4 bg-card/10 border border-dashed rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-secondary/15 flex items-center justify-center mx-auto text-muted-foreground/30">
            <HugeiconsIcon icon={HelpCircleIcon} size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground leading-normal max-w-xs mx-auto">
              There are no notifications matching the selected filters.
            </p>
          </div>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="text-xs font-bold tracking-wider uppercase px-6 py-2.5 rounded-xl cursor-pointer border hover:bg-accent/20"
          >
            {isLoadingMore ? "Loading..." : "Load More Notifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
