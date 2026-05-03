import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { SearchBar } from "@/components/layout/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell, Globe } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Suspense } from "react";

export default function Navbar() {
  return (
    // sticky already establishes the containing block for the SearchBar overlay
    <header className="h-16 border-b border-secondary bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 w-full">
      {/* Left: hamburger (mobile only) + logo */}
      <div className="flex items-center gap-1">
        <MobileNavDrawer />

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
      </div>

      {/* Center: full search bar on desktop, empty space on mobile */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-md hidden md:block">
          <Suspense fallback={<Skeleton className="h-9 w-full rounded-lg" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {/* Right: search icon (mobile) + notifications + theme toggle */}
      <div className="flex items-center gap-1">
        <div className="md:hidden">
          <Suspense fallback={<Skeleton className="h-9 w-9 rounded-lg" />}>
            <SearchBar />
          </Suspense>
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HugeiconsIcon icon={Bell} className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
