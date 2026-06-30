"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { METADATA_COLORS } from "@/utils/colors";
import { getImpactHoverBorder, getImpactHoverGradient, getImpactHoverText, getImpactTextColor } from "@/utils/stories";

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
              "relative overflow-hidden w-full p-3 rounded-xl border text-left transition-all group cursor-pointer block",
              isActive
                ? "bg-secondary border-border/80 shadow-sm"
                : "bg-muted/30 border-border",
              !isActive && getImpactHoverBorder(cluster.impact)
            )}
          >
            <div 
              className={cn(
                "pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                getImpactHoverGradient(cluster.impact)
              )} 
            />

            <h4 className={cn(
              "relative z-10 text-xs font-semibold leading-snug mb-2 line-clamp-2 transition-colors",
              isActive 
                ? getImpactTextColor(cluster.impact) 
                : `text-foreground ${getImpactHoverText(cluster.impact)}`
            )}>
              {cluster.title}
            </h4>
            
            <div className="relative z-10 flex items-center justify-between gap-2 mt-2">
              <div className="text-[10px] font-medium text-muted-foreground truncate">
                {cluster.articleCount} articles • {sourceCount} {sourceCount === 1 ? "source" : "sources"}
              </div>
              
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Origin Dots Pill */}
                {cluster.origins && cluster.origins.length > 0 && (
                  <div className="flex items-center space-x-0.5 bg-muted/40 px-1.5 py-0.5 rounded-md">
                    {cluster.origins.map((o) => (
                      <span
                        key={o}
                        title={`${o} origin`}
                        className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                        style={{
                          backgroundColor:
                            METADATA_COLORS.region[
                              o as keyof typeof METADATA_COLORS.region
                            ] || "#9ca3af",
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Impact Indicator Dot */}
                {cluster.impact && (
                  <div
                    title={`Impact: ${cluster.impact}`}
                    className="w-2 h-2 rounded-full shadow-sm shrink-0"
                    style={{
                      backgroundColor:
                        METADATA_COLORS.impact[
                          cluster.impact as keyof typeof METADATA_COLORS.impact
                        ] || "#3b82f6",
                    }}
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
