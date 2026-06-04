import { getClusterStats } from "@/queries/analytics";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-emerald-500",
};

export async function EventClustersWidget() {
  const stats = await getClusterStats();

  // Fetch top 3 active clusters
  let topClusters = [];
  try {
    topClusters = await prisma.storyCluster.findMany({
      where: { isActive: true },
      orderBy: { articleCount: "desc" },
      take: 3,
    });
  } catch (error) {
    console.error("EventClustersWidget error:", error);
  }

  if (!stats) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Active Event Clusters ({stats.activeCount})
      </h3>

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
        {topClusters.map((cluster) => (
          <div
            key={cluster.id}
            className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-all group"
          >
            <h4 className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-tight mb-1 line-clamp-2">
              {cluster.title}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">
                {cluster.articleCount} articles • {cluster.topSources.length}{" "}
                sources
              </span>
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  IMPACT_COLORS[cluster.impact || "MEDIUM"],
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
