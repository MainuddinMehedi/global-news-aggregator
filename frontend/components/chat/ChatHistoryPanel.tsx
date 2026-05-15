"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { useState, useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";

export type ChatSessionListItem = {
  id: string;
  title: string;
  model: string;
  responseMode: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type ChatHistoryPanelProps = {
  sessions: ChatSessionListItem[];
  activeSessionId?: string;
  loading?: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  className?: string;
};

type Tab = "chats" | "bookmarks" | "images";

export default function ChatHistoryPanel({
  sessions,
  activeSessionId,
  loading,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  className,
}: ChatHistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sessions, searchQuery]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, ChatSessionListItem[]> = {};
    filteredSessions.forEach((session) => {
      const date = parseISO(session.updatedAt);
      let groupKey = "";
      if (isToday(date)) {
        groupKey = "Today";
      } else if (isYesterday(date)) {
        groupKey = "Yesterday";
      } else {
        groupKey = format(date, "MMMM d, yyyy");
      }
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });
    return groups;
  }, [filteredSessions]);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header with New Chat */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-border/50">
          {(["chats", "bookmarks", "images"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-2 text-sm font-medium transition-colors relative",
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} History`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border-none focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-sleek">
        {loading ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            Loading {activeTab}...
          </div>
        ) : activeTab !== "chats" ? (
          <div className="px-3 py-4 text-xs text-muted-foreground italic">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} history
            coming soon.
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            No saved chats found.
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {Object.entries(groupedSessions).map(([group, groupSessions]) => (
              <div key={group} className="space-y-1">
                <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group}
                </h3>
                {groupSessions.map((session) => {
                  const active = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative rounded-xl transition-colors",
                        active ? "bg-accent/80" : "hover:bg-accent/40",
                      )}
                    >
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className="w-full p-3 pr-14 text-left"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="truncate text-sm font-medium text-foreground">
                            {session.title}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <RelativeTime date={session.updatedAt} />
                            <span>•</span>
                            <span>{session.messageCount} messages</span>
                          </div>
                        </div>
                      </button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          aria-label="Bookmark"
                        >
                          <HugeiconsIcon
                            icon={Bookmark01Icon}
                            className="h-4 w-4"
                          />
                        </button>
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          aria-label={`Delete ${session.title}`}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="h-4 w-4"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
