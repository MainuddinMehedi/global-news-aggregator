import { getClusterStats, getStoryClustersWithPerspectives } from "@/queries/analytics";
import { cn } from "@/lib/utils";
import EventClustersList from "./EventClustersList";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-emerald-500",
};

export async function EventClustersWidget() {
  const [stats, clusters] = await Promise.all([
    getClusterStats(),
    getStoryClustersWithPerspectives(),
  ]);

  if (!stats) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Active Event Clusters ({stats.activeCount})
      </h3>

      {/* Impact distribution header */}
      <div className="grid grid-cols-4 gap-1 mb-4">
        {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((impact) => {
          const count =
            stats.impactDistribution.find((d) => d.label === impact)?.count ||
            0;
          return (
            <div
              key={impact}
              className="flex flex-col items-center p-2 rounded-lg bg-muted/30"
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full mb-1",
                  IMPACT_COLORS[impact],
                )}
              />
              <span className="text-[10px] font-bold text-foreground">
                {count}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase">
                {impact.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">
          Top Stories
        </p>
        <Suspense fallback={<EventClustersListSkeleton />}>
          <EventClustersList clusters={clusters} />
        </Suspense>
      </div>
    </div>
  );
}

function EventClustersListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
