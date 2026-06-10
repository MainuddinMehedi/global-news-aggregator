"use client";

import { useState, useEffect } from "react";
import { TopicFinding } from "@/types/lockedTopic";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Tick01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { RelativeTime } from "../ui/RelativeTime";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchAndMarkRead = async () => {
      if (unreadCount === 0) return;
      setIsLoading(true);

      try {
        // 1. Fetch unread findings
        const res = await fetch(
          `/api/locked-topics/${topicId}/findings?unreadOnly=true&limit=10`,
        );
        if (!res.ok) throw new Error("Failed to fetch unread findings");
        const data = await res.json();
        if (isMounted) setFindings(data.findings);

        // 2. Mark them as read
        const readRes = await fetch(`/api/locked-topics/${topicId}/read`, {
          method: "POST",
        });
        if (!readRes.ok) throw new Error("Failed to mark as read");

        // Refresh router to clear badges globally
        router.refresh();
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAndMarkRead();
    return () => {
      isMounted = false;
    };
  }, [isOpen, topicId, unreadCount, router]);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`/api/locked-topics/${topicId}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to mark as read");

      toast.success("All findings marked as read");

      setFindings([]);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark findings as read");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={unreadCount > 0 && isActive ? "secondary" : "ghost"}
          size="icon"
          className={`relative h-9 w-9 rounded-xl transition-colors ${
            unreadCount > 0 && isActive
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-primary"
          }`}
          title="Recent findings"
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon icon={Notification01Icon} className="h-4 w-4" />
          {unreadCount > 0 && isActive && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 rounded-2xl border-secondary shadow-2xl overflow-hidden"
        align="end"
      >
        <div className="p-4 border-b border-secondary bg-secondary/5 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <HugeiconsIcon
              icon={Notification01Icon}
              size={16}
              className="text-primary"
            />
            Unread Findings
          </h3>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              onClick={handleMarkAllAsRead}
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
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : findings.length > 0 ? (
            <div className="divide-y divide-secondary/50">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 hover:bg-secondary/10 transition-colors group"
                >
                  <Link
                    href={finding.sourceUrl}
                    target="_blank"
                    className="block space-y-1"
                  >
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
                  </Link>
                </div>
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

        {unreadCount > 10 && (
          <Link
            href={`/locked-topics/${topicId}?source=ALL&sort=newest`}
            className="block p-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/10 hover:text-primary transition-all border-t border-secondary"
            onClick={() => setIsOpen(false)}
          >
            See All {unreadCount} Findings
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={12}
              className="inline-block ml-1"
            />
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
