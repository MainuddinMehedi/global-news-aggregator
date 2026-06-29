"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface StoryCluster {
  id: string;
  slug: string;
  title: string;
  articleCount: number;
  impact: string | null;
  topSources: string[];
  origins: string[];
}

interface EventClustersListProps {
  clusters: StoryCluster[];
}

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-emerald-500",
};

const ORIGIN_DOT_COLORS: Record<string, string> = {
  "North America": "bg-blue-500",
  Europe: "bg-emerald-500",
  "Middle East": "bg-amber-500",
  "Asia-Pacific": "bg-red-500",
  "South America": "bg-purple-500",
  Africa: "bg-orange-500",
  Global: "bg-slate-400",
};

export default function EventClustersList({ clusters }: EventClustersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeStory = searchParams.get("story") ?? "";

  const handleSelect = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeStory === slug) {
      params.delete("story");
    } else {
      params.set("story", slug);
    }
    // Reset cursor on filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  if (clusters.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic text-center py-4">
        No active story clusters.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {clusters.map((cluster) => {
        const isActive = activeStory === cluster.slug;
        const sourceCount = cluster.topSources?.length || 0;
        
        return (
          <button
            key={cluster.id}
            onClick={() => handleSelect(cluster.slug)}
            className={cn(
              "w-full p-3 rounded-xl border text-left transition-all hover:border-primary/50 group cursor-pointer block",
              isActive
                ? "bg-secondary border-border/80 shadow-sm"
                : "bg-muted/30 border-border"
            )}
          >
            <h4 className={cn(
              "text-xs font-semibold leading-snug mb-2 line-clamp-2 transition-colors",
              isActive 
                ? "text-primary" 
                : "text-foreground group-hover:text-primary"
            )}>
              {cluster.title}
            </h4>
            
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="text-[10px] font-medium text-muted-foreground truncate">
                {cluster.articleCount} articles • {sourceCount} {sourceCount === 1 ? "source" : "sources"}
              </div>
              
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Origin Dots Pill */}
                {cluster.origins && cluster.origins.length > 0 && (
                  <div className="flex items-center space-x-1 bg-muted/40 px-1.5 py-0.5 rounded-md border border-border/20">
                    {cluster.origins.map((o) => (
                      <span
                        key={o}
                        title={`${o} origin`}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full inline-block shrink-0",
                          ORIGIN_DOT_COLORS[o] || "bg-slate-400"
                        )}
                      />
                    ))}
                  </div>
                )}
                
                {/* Impact Indicator Dot */}
                {cluster.impact && (
                  <div
                    title={`Impact: ${cluster.impact}`}
                    className={cn(
                      "w-2 h-2 rounded-full border border-background shadow-sm shrink-0",
                      IMPACT_COLORS[cluster.impact] || "bg-blue-500"
                    )}
                  />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
