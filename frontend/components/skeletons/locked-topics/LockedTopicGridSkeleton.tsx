import { Skeleton } from "@/components/ui/skeleton";

export default function LockedTopicGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col h-[320px] rounded-xl border border-border bg-card overflow-hidden animate-pulse"
        >
          {/* Card Header */}
          <div className="p-5 border-b border-border/50 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Card Body - Findings */}
          <div className="flex-1 p-5 space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>

          {/* Card Footer */}
          <div className="p-4 bg-muted/30 border-t border-border/50 flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
