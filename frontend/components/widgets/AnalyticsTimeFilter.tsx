"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

const ranges = [
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "all", label: "ALL" },
];

export function AnalyticsTimeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "7d";
  const [isPending, startTransition] = useTransition();

  const handleRangeChange = (rangeId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (rangeId === "7d") {
        params.delete("range"); // default
      } else {
        params.set("range", rangeId);
      }
      router.push(`/analytics?${params.toString()}`);
    });
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-border/50 bg-card/40 p-1 backdrop-blur-md">
      {ranges.map((range) => {
        const isActive = currentRange === range.id;
        return (
          <button
            key={range.id}
            onClick={() => handleRangeChange(range.id)}
            disabled={isPending}
            className={cn(
              "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
