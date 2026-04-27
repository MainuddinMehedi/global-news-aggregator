import { Info, Globe, Shield, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const sourcesByPerspective = [
  {
    id: "all",
    label: "All Sources",
    count: 10,
    color: "bg-zinc-500",
    active: true,
  },
  { id: "wire", label: "Wire Services", count: 0, color: "bg-orange-500" },
  { id: "western", label: "Western", count: 3, color: "bg-blue-500" },
  {
    id: "non-western",
    label: "Non-Western",
    count: 3,
    color: "bg-emerald-500",
  },
  { id: "eastern", label: "Eastern", count: 4, color: "bg-red-500" },
];

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

const biasDistribution = [
  { label: "Wire/Neutral", count: 0, total: 10, color: "bg-zinc-700" },
  { label: "Western", count: 3, total: 10, color: "bg-blue-500" },
  { label: "Non-Western", count: 3, total: 10, color: "bg-emerald-500" },
  { label: "Eastern", count: 4, total: 10, color: "bg-red-500" },
];

export function RightPanel() {
  return (
    <aside className="w-80 bg-background/50 hidden xl:flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-hide">
      {/* Sources by Perspective Block */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4 px-1">
          Sources by Perspective
        </h3>
        <div className="space-y-1.5">
          {sourcesByPerspective.map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                item.active
                  ? "bg-blue-600/10 border border-blue-500/20"
                  : "hover:bg-zinc-800/50 border border-transparent",
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.active
                      ? "text-zinc-100"
                      : "text-zinc-400 group-hover:text-zinc-200",
                  )}
                >
                  {item.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-mono px-2 py-0.5 rounded-full",
                  item.active
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-zinc-800 text-zinc-500",
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Clusters Block */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4 px-1">
          Event Clusters
        </h3>
        <div className="space-y-3">
          {eventClusters.map((cluster, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group"
            >
              <h4 className="text-sm font-medium text-zinc-200 group-hover:text-blue-400 transition-colors leading-tight mb-2">
                {cluster.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">
                  {cluster.sources} sources
                </span>
                <div className="flex -space-x-1">
                  {cluster.perspectives.map((color, j) => (
                    <div
                      key={j}
                      className={cn(
                        "w-2 h-2 rounded-full border border-zinc-900",
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

      {/* Bias Distribution Block */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4 px-1">
          Bias Distribution
        </h3>
        <div className="space-y-4">
          {biasDistribution.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 font-medium">{item.label}</span>
                <span className="text-zinc-400 font-mono">{item.count}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.color,
                  )}
                  style={{ width: `${(item.count / item.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diversity Insights */}
      <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-blue-300">
            Diversity Insight
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Balanced coverage detected for active stories. Western and Non-Western
          sources are equally represented in the current clusters.
        </p>
      </div>
    </aside>
  );
}
