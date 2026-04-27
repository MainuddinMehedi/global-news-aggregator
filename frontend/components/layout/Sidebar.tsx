"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Newspaper,
  MessageSquare,
  BarChart2,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const navItems = [
  { id: "/", label: "Feed", icon: Newspaper, badge: 0 },
  { id: "/chat", label: "AI Chat", icon: MessageSquare, badge: 0 },
  { id: "/analytics", label: "Analytics", icon: BarChart2, badge: 0 },
  { id: "/settings", label: "Settings", icon: Settings, badge: 0 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed } = useAppStore();

  return (
    <aside 
      className={cn(
        "flex-shrink-0 border-r border-border bg-card flex flex-col justify-between transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {/* Navigation */}
        <nav className="px-2.5 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border group",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border-blue-500/50"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 border-transparent"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", !sidebarCollapsed && "mr-3")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && item.badge > 0 && (
                  <span className="ml-auto bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-2.5 border-t border-border">
        <button
          onClick={() => router.push("/settings")}
          className={cn(
            "w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/settings"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:text-zinc-100"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            U
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 text-left">
              <div className="text-sm font-medium text-zinc-200">You</div>
              <div className="text-xs text-zinc-500">Free Tier</div>
            </div>
          )}
          {!sidebarCollapsed && <ChevronRight className="w-4 h-4 ml-auto text-zinc-600" />}
        </button>
      </div>
    </aside>
  );
}
