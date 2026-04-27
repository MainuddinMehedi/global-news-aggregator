"use client";

import { Search, Bell, Moon, Globe2, Menu } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useCallback, useEffect, useState } from "react";

export function TopHeader() {
  const { searchQuery, setSearchQuery, toggleSidebar } = useAppStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 w-full">
      {/* Left: Branding & Toggle */}
      <div className="flex flex-1 items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-bold text-lg tracking-tight hidden sm:block">
            GlobalAgg<span className="text-blue-500">.</span>
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search articles, entities..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-1 items-center justify-end space-x-2">
        <button className="relative p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>
        <button className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors">
          <Moon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
