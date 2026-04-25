"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Newspaper,
  MessageSquare,
  BarChart2,
  Settings,
  Globe2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "/", label: "Feed", icon: Newspaper, badge: 0 },
  { id: "/chat", label: "AI Chat", icon: MessageSquare, badge: 0 },
  { id: "/analytics", label: "Analytics", icon: BarChart2, badge: 0 },
  { id: "/settings", label: "Settings", icon: Settings, badge: 0 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-16 lg:w-60 flex-shrink-0 border-r border-border bg-card flex flex-col justify-between transition-all duration-300">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-bold text-lg hidden lg:block tracking-tight">
            GlobalAgg<span className="text-blue-500">.</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-2.5 space-y-1">
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
                <Icon className="w-5 h-5 lg:mr-3 flex-shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
                {item.badge > 0 && (
                  <span className="hidden lg:flex ml-auto bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs font-mono">
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            U
          </div>
          <div className="ml-3 hidden lg:block text-left">
            <div className="text-sm font-medium text-zinc-200">You</div>
            <div className="text-xs text-zinc-500">Free Tier</div>
          </div>
          <ChevronRight className="w-4 h-4 ml-auto hidden lg:block text-zinc-600" />
        </button>
      </div>
    </aside>
  );
}
