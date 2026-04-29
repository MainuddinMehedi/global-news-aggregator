import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Globe, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 w-full">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <HugeiconsIcon icon={Globe} className="w-5 h-5 text-white" />
        </div>
        <span className="ml-3 font-bold text-lg tracking-tight hidden sm:block">
          GlobalAgg<span className="text-blue-500">.</span>
        </span>
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md hidden md:block">
          <HugeiconsIcon
            icon={Search}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search articles, entities..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            // value={localQuery}
            // onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: theme toggle */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}
