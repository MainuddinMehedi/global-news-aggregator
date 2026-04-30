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

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive =
          item.id === "/" ? pathname === "/" : pathname.startsWith(item.id);

        return (
          <Link
            key={item.id}
            href={item.id}
            // className="w-full flex items-center gap-2 px-2 py-3 rounded-lg text-sm font-medium hover:bg-sidebar-accent group hover:text-sidebar-accent-foreground transition-all duration-200"
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              // Default state
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              // Active state
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <HugeiconsIcon icon={item.icon} />
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground py-0.5 px-2 rounded-full text-xs font-mono">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
