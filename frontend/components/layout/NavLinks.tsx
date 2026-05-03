"use client";

import { cn } from "@/lib/utils";
import {
  AllBookmarkIcon,
  GitMerge,
  MessageSquare,
  Newspaper,
  PresentationBarChart02FreeIcons,
  Settings,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { id: "/", label: "Feed", icon: Newspaper, badge: 5 },
  { id: "/stories", label: "Stories", icon: GitMerge, badge: 0 },
  { id: "/chat", label: "AI Chat", icon: MessageSquare, badge: 0 },
  {
    id: "/analytics",
    label: "Analytics",
    icon: PresentationBarChart02FreeIcons,
    badge: 0,
  },
  {
    id: "/locked-topics",
    label: "Locked Topics",
    icon: AllBookmarkIcon,
    badge: 0,
  },
  { id: "/settings", label: "Settings", icon: Settings, badge: 0 },
];

interface NavLinksProps {
  /**
   * When true (e.g. inside the mobile Sheet drawer), always show icon + label
   * regardless of viewport width. Defaults to false (responsive: icon-only at
   * md, full labels at lg+).
   */
  alwaysFull?: boolean;
  /** Called when any nav link is clicked — used by the mobile drawer to close itself. */
  onNavigate?: () => void;
}

export default function NavLinks({
  alwaysFull = false,
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.id === "/" ? pathname === "/" : pathname.startsWith(item.id);

        return (
          <Link
            key={item.id}
            href={item.id}
            onClick={onNavigate}
            className={cn(
              "w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              // Responsive layout only when not forced full
              alwaysFull
                ? "justify-start px-3"
                : "justify-center px-2 lg:justify-start lg:px-3",
              // Default state
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              // Active state
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <HugeiconsIcon icon={item.icon} className="shrink-0 w-4.5 h-4.5" />

            {/* Label: always visible in drawer, responsive in sidebar */}
            <span className={alwaysFull ? "block" : "hidden lg:block"}>
              {item.label}
            </span>

            {/* Badge: always visible in drawer, responsive in sidebar */}
            {item.badge > 0 && (
              <span
                className={cn(
                  "ml-auto bg-primary text-primary-foreground py-0.5 px-2 rounded-full text-xs font-mono",
                  alwaysFull ? "flex" : "hidden lg:flex",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
