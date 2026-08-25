"use client";

import { cn } from "@/lib/utils";
import { REGION_UI_COLORS } from "@/utils/colors";
import { useRouter, useSearchParams } from "next/navigation";

interface EventRegionListProps {
  distribution: { label: string; count: number }[];
  total: number;
}

export default function EventRegionList({
  distribution,
  total,
}: EventRegionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRegion = searchParams.get("region") ?? "all";

  const items = [
    {
      id: "all",
      label: "All Regions",
      count: total,
      dotColor: "bg-slate-400 dark:bg-slate-500",
    },
    ...distribution
      .map((item) => ({
        id: item.label,
        label: item.label,
        count: item.count,
        dotColor:
          REGION_UI_COLORS[item.label] || "bg-slate-400 dark:bg-slate-500",
      }))
      .sort((a, b) => b.count - a.count),
  ];

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("region");
    } else {
      params.set("region", id);
    }
    // Reset page cursor when filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = activeRegion === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer",
              isActive
                ? "bg-secondary text-secondary-foreground border-border/80 shadow-sm font-semibold"
                : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex items-center space-x-3">
              <span className={cn("w-2 h-2 rounded-full", item.dotColor)} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full",
                isActive
                  ? "bg-primary/25 text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground",
              )}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
