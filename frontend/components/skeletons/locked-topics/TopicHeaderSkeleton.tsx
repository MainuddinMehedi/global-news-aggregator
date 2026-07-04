import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TopicHeaderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/locked-topics"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Locked Topics
              </Link>
              <span className="text-muted-foreground/30 text-xs">/</span>
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 md:h-12 w-3/4 rounded-xl mt-2" />
        </div>

        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Notifications */}
          <div className="h-6 w-px bg-border hidden md:block" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" /> {/* Clear */}
            <Skeleton className="h-10 w-10 rounded-xl" /> {/* Delete */}
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" /> {/* Edit Tracker */}
          <Skeleton className="h-10 w-28 rounded-xl" /> {/* Scan Now */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 rounded-2xl bg-secondary/10 border border-border space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="pt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-muted/10 border border-border flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
