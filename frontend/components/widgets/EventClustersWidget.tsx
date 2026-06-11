import { getClusterStats, getStoryClustersWithOrigins } from "@/queries/analytics";
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
    getStoryClustersWithOrigins(),
  ]);

  if (!stats) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Active Event Clusters ({stats.activeCount})
      </h3>

      {/* Impact distribution header - 4 square items in one line */}
      <div className="grid grid-cols-4 gap-1 mb-5">
        {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((impact) => {
          const count =
            stats.impactDistribution.find((d) => d.label === impact)?.count ||
            0;
          return (
            <div
              key={impact}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold backdrop-blur-sm transition-all",
                impact === "CRITICAL"
                  ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/15 text-red-600 dark:text-red-400"
                  : impact === "HIGH"
                    ? "bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/15 text-orange-600 dark:text-orange-400"
                    : impact === "MEDIUM"
                      ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/15 text-blue-600 dark:text-blue-400"
                      : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full mb-1 shrink-0",
                  IMPACT_COLORS[impact],
                )}
              />
              <span className="text-[11px] font-mono font-bold leading-none mb-1">
                {count}
              </span>
              <span className="text-[7.5px] font-bold uppercase tracking-wider opacity-85">
                {impact === "CRITICAL" ? "Crit" : impact.slice(0, 3).toLowerCase()}
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
