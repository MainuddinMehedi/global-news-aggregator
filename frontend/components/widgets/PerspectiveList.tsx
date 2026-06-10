"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PerspectiveListProps {
  counts: {
    all: number;
    wire: number;
    western: number;
    nonWestern: number;
    eastern: number;
  };
}

export default function PerspectiveList({ counts }: PerspectiveListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePerspective = searchParams.get("perspective") ?? "all";

  const items = [
    { id: "all", label: "All Sources", count: counts.all, dotColor: "bg-slate-400 dark:bg-slate-500" },
    { id: "wire", label: "Wire Services", count: counts.wire, dotColor: "bg-amber-500" },
    { id: "western", label: "Western", count: counts.western, dotColor: "bg-blue-500" },
    { id: "non-western", label: "Non-Western", count: counts.nonWestern, dotColor: "bg-emerald-500" },
    { id: "eastern", label: "Eastern", count: counts.eastern, dotColor: "bg-red-500" },
  ];

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("perspective");
    } else {
      params.set("perspective", id);
    }
    // Reset page cursor when filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = activePerspective === item.id;
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
