"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const isCollapsed = useIsSidebarCollapsed();
  const setCollapsed = useSetSidebarCollapsed();
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a stable default (false) for the server and initial client render
  const effectiveCollapsed = mounted ? isCollapsed : false;

  return (
    <aside
      className={cn(
        "h-full w-full flex flex-col justify-between py-5 px-2 bg-sidebar text-sidebar-foreground transition-all duration-300",
        effectiveCollapsed ? "items-center" : "items-start px-3",
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
          <NavLinks isManualCollapsed={effectiveCollapsed} />
        </Suspense>
      </div>

      <div className="w-full space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3",
            effectiveCollapsed && "justify-center px-0",
          )}
        >
          <HugeiconsIcon
            icon={SidebarLeftIcon}
            className={cn(
              "shrink-0 w-5 h-5 transition-transform duration-300",
              effectiveCollapsed && "rotate-180",
            )}
          />
          {!effectiveCollapsed && <span>Collapse</span>}
        </button>

        {/* User Profile */}
        <Link href="/settings">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
              effectiveCollapsed && "justify-center px-0",
            )}
          >
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="shrink-0 w-6 h-6 rounded-full" />
            ) : (
              <HugeiconsIcon icon={UserCircle02Icon} className="shrink-0 w-6 h-6" />
            )}
            {!effectiveCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate text-sidebar-foreground">
                  {status === "loading" ? "Loading..." : session?.user ? session.user.name || session.user.email?.split("@")[0] || "User" : "Sign In"}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}
