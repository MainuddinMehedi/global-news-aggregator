"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface SourceOriginListProps {
  countsData: {
    all: number;
    counts: Record<string, number>;
  };
}

const ORIGIN_COLORS: Record<string, string> = {
  "North America": "bg-blue-500",
  "Middle East": "bg-amber-500",
  "Asia-Pacific": "bg-emerald-500",
  "Europe": "bg-indigo-500",
  "Latin America": "bg-orange-500",
  "Africa": "bg-yellow-500",
  "Global": "bg-purple-500",
  "Unknown": "bg-slate-400 dark:bg-slate-500",
};

const CANONICAL_REGIONS = [
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "Latin America",
  "Africa",
  "Global",
];

export default function SourceOriginList({ countsData }: SourceOriginListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeOrigin = searchParams.get("origin") ?? "all";

  // Create items list from canonical regions, sorted by count
  const originItems = CANONICAL_REGIONS.map((origin) => ({
    id: origin,
    label: origin,
    count: countsData.counts[origin] || 0,
    dotColor: ORIGIN_COLORS[origin] || "bg-slate-400 dark:bg-slate-500",
  })).sort((a, b) => b.count - a.count);

  const items = [
    { id: "all", label: "All Regions", count: countsData.all, dotColor: "bg-slate-400 dark:bg-slate-500" },
    ...originItems,
  ];

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("origin");
    } else {
      params.set("origin", id);
    }
    // Reset page cursor when filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = activeOrigin === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer",
              isActive
                ? "bg-secondary text-secondary-foreground border-border/80 shadow-sm font-semibold"
                : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center space-x-3">
              <span className={cn("w-2 h-2 rounded-full", item.dotColor)} />
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </div>
            <span className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full",
              isActive 
                ? "bg-primary/25 text-primary-foreground" 
                : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground"
            )}>
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
