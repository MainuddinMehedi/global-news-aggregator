import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, Globe, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="h-16 border-b border-sidebar-primary-foreground bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 w-full">
      {/* Left: logo and title  */}
      <Link href={"/"}>
        <div className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <HugeiconsIcon
              icon={Globe}
              className="w-5 h-5 text-primary-foreground"
            />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block text-foreground">
            GlobalAgg<span className="text-primary">.</span>
          </span>
        </div>
      </Link>

      {/* Center: search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md hidden md:block">
          <HugeiconsIcon
            icon={Search}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search articles, entities..."
            className="w-full bg-muted/50 border border-input rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all placeholder:text-muted-foreground"
            // value={localQuery}
            // onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: theme toggle */}
      <div className="flex items-center space-x-2">
        {/* notification button */}
        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HugeiconsIcon icon={Bell} className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
