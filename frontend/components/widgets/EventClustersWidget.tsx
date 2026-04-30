import { cn } from "@/lib/utils";

const eventClusters = [
  {
    title: "Israeli strikes on Lebanon post-ceasefire",
    sources: 4,
    perspectives: ["bg-orange-500", "bg-red-500", "bg-blue-500"],
  },
  {
    title: "Trump-NATO tensions over Iran",
    sources: 2,
    perspectives: ["bg-red-500", "bg-orange-500"],
  },
  {
    title: "Strait of Hormuz shipping crisis",
    sources: 3,
    perspectives: ["bg-red-500", "bg-blue-500", "bg-orange-500"],
  },
];

export function EventClustersWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Event Clusters
      </h3>
      <div className="space-y-3">
        {eventClusters.map((cluster, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-all cursor-pointer group"
          >
            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
              {cluster.title}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">
                {cluster.sources} sources
              </span>
              <div className="flex -space-x-1">
                {cluster.perspectives.map((color, j) => (
                  <div
                    key={j}
                    className={cn(
                      "w-2 h-2 rounded-full border border-card",
                      color,
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
