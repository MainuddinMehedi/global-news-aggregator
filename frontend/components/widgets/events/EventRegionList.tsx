"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface EventRegionListProps {
  distribution: { label: string; count: number }[];
  total: number;
}

const REGION_COLORS: Record<string, string> = {
  "North America": "bg-blue-500",
  Europe: "bg-emerald-500",
  "Middle East": "bg-red-500",
  "Asia-Pacific": "bg-fuchsia-500",
  "South America": "bg-orange-500",
  Africa: "bg-yellow-500",
  Global: "bg-indigo-500",
  Unknown: "bg-muted-foreground/10",
};

export default function EventRegionList({ distribution, total }: EventRegionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRegion = searchParams.get("region");

  const handleSelect = (label: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeRegion === label) {
      params.delete("region");
    } else {
      params.set("region", label);
    }
    // Reset page cursor when filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {distribution.map((item) => {
        const isActive = activeRegion === item.label;
        const colorClass = REGION_COLORS[item.label] || REGION_COLORS.Unknown;
        
        return (
          <button
            key={item.label}
            onClick={() => handleSelect(item.label)}
            className={cn(
              "w-full text-left space-y-1.5 p-2 rounded-lg transition-colors group cursor-pointer",
              isActive ? "bg-secondary/50" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className={cn("font-medium transition-colors", isActive ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground")}>
                {item.label}
              </span>
              <span className={cn("font-mono", isActive ? "text-foreground font-bold" : "text-foreground")}>{item.count}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  colorClass
                )}
                style={{ width: `${(item.count / (total || 1)) * 100}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
