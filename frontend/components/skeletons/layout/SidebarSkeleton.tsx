import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="h-full w-14 lg:w-56 flex flex-col justify-between py-5 px-2 lg:px-3 bg-sidebar text-sidebar-foreground border-r border-border shrink-0 transition-all duration-300">
      {/* Top Section: Nav Links Skeleton */}
      <div className="w-full space-y-3">
        {/* Nav Items */}
        <div className="space-y-1.5 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-card/10 animate-pulse"
            >
              <Skeleton className="w-5 h-5 rounded-lg shrink-0 bg-muted/40" />
              <Skeleton className="hidden lg:block h-4 w-24 bg-muted/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Footer / User Profile Skeleton */}
      <div className="w-full space-y-2 pt-4 border-t border-border/30">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-card/10 animate-pulse">
          <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-muted/40" />
          <div className="hidden lg:flex flex-col gap-1 flex-1">
            <Skeleton className="h-3.5 w-20 bg-muted/40" />
            <Skeleton className="h-2.5 w-28 bg-muted/30" />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
