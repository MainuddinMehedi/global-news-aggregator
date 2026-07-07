import { WidgetListSkeleton } from "@/components/skeletons/home/WidgetListSkeleton";
import EventClustersList from "@/components/widgets/events/EventClustersList";
import {
  getClusterStats,
  getStoryClustersWithOrigins,
} from "@/queries/analytics/widgets";
import { METADATA_COLORS } from "@/utils/colors";
import { Suspense } from "react";

export function EventClustersWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Active Event Clusters
      </h3>
      <Suspense fallback={<WidgetListSkeleton count={4} />}>
        <EventClustersContent />
      </Suspense>
    </div>
  );
}

async function EventClustersContent() {
  const [stats, clusters] = await Promise.all([
    getClusterStats(),
    getStoryClustersWithOrigins(),
  ]);

  if (!stats) return null;

  return (
    <>
      {/* Impact distribution header - 4 square items in one line */}
      <div className="grid grid-cols-4 gap-1 mb-5">
        {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((impact) => {
          const count =
            stats.impactDistribution.find((d) => d.label === impact)?.count ||
            0;
          const hexColor =
            METADATA_COLORS.impact[
              impact as keyof typeof METADATA_COLORS.impact
            ] || "#3b82f6";

          return (
            <div
              key={impact}
              className="flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold backdrop-blur-sm transition-all"
              style={{
                backgroundColor: `${hexColor}0D`, // 5% opacity
                borderColor: `${hexColor}26`, // 15% opacity
                color: hexColor,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mb-1 shrink-0"
                style={{ backgroundColor: hexColor }}
              />
              <span className="text-[11px] font-mono font-bold leading-none mb-1">
                {count}
              </span>
              <span className="text-[7.5px] font-bold uppercase tracking-wider opacity-85">
                {impact === "CRITICAL"
                  ? "Crit"
                  : impact.slice(0, 3).toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">
          Top Stories
        </p>
        <EventClustersList clusters={clusters} />
      </div>
    </>
  );
}
