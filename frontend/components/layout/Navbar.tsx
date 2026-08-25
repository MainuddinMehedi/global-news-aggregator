import { auth } from "@/auth";
import SuspensionWarning from "@/components/auth/SuspensionWarning";
import LastIngestionTime from "@/components/layout/LastIngestionTime";
import MobileNavDrawer from "@/components/layout/MobileNavDrawer";
import { SearchBar } from "@/components/layout/SearchBar";
import NotificationBell from "@/components/notifications/NotificationBell";
import Logo from "@/components/ui/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { Suspense } from "react";

export default async function Navbar() {
  const session = await auth();
  const isSuspended = session?.user?.suspended === true;

  return (
    // sticky already establishes the containing block for the SearchBar overlay
    <header className="h-16 border-b border-secondary bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 w-full">
      {/* Left: hamburger (mobile only) + logo */}
      <div className="flex items-center gap-1">
        <MobileNavDrawer />

        <Link href={"/"}>
          <Logo />
        </Link>
      </div>

      {/* Center: full search bar on desktop, empty space on mobile */}
      <div className="flex-1 flex items-center px-4">
        <div className="flex-1" />
        <div className="relative w-full max-w-md hidden md:block">
          <Suspense fallback={<Skeleton className="h-9 w-full rounded-lg" />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="flex-1 hidden md:flex justify-center items-center">
          <Suspense fallback={<Skeleton className="h-4 w-24 rounded" />}>
            <LastIngestionTime />
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

        <Suspense fallback={<Skeleton className="h-9 w-9 rounded-lg" />}>
          <NotificationBell />
        </Suspense>

        {isSuspended && <SuspensionWarning />}

        <ThemeToggle />
      </div>
    </header>
  );
}
