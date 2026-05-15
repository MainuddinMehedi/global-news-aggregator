"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeftIcon, UserCircle02Icon } from "@hugeicons/core-free-icons";
import { Suspense } from "react";
import NavLinks from "./NavLinks";
import GlobalStatsFetcher from "./GlobalStatsFetcher";
import { useIsSidebarCollapsed, useSetSidebarCollapsed } from "@/store";

interface SidebarContentProps {
  matchCount: number;
  topicCount: number;
  articleCount: number;
  storyCount: number;
}

export default function SidebarContent({
  matchCount,
  topicCount,
  articleCount,
  storyCount,
}: SidebarContentProps) {
  const isCollapsed = useIsSidebarCollapsed();
  const setCollapsed = useSetSidebarCollapsed();

  return (
    <aside
      className={cn(
        "h-full w-full flex flex-col justify-between py-5 px-2 bg-sidebar text-sidebar-foreground transition-all duration-300",
        isCollapsed ? "items-center" : "items-start px-3",
      )}
    >
      <div className="w-full">
        <GlobalStatsFetcher
          articleCount={articleCount}
          storyCount={storyCount}
          topicMatchCount={matchCount}
          lockedTopicCount={topicCount}
        />
        <Suspense
          fallback={
            <div className="h-32 w-full animate-pulse bg-muted rounded-xl" />
          }
        >
          <NavLinks isManualCollapsed={isCollapsed} />
        </Suspense>
      </div>

      <div className="w-full space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3",
            isCollapsed && "justify-center px-0",
          )}
        >
          <HugeiconsIcon
            icon={SidebarLeftIcon}
            className={cn(
              "shrink-0 w-5 h-5 transition-transform duration-300",
              isCollapsed && "rotate-180",
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </button>

        {/* User Profile Stub */}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70",
            isCollapsed && "justify-center px-0",
          )}
        >
          <HugeiconsIcon icon={UserCircle02Icon} className="shrink-0 w-6 h-6" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate text-sidebar-foreground">
                MainuddinMehedi
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
