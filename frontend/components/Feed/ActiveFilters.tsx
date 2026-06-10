"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ActiveFiltersProps {
  perspective: string;
  story: string;
  activeStoryTitle?: string;
}

export default function ActiveFilters({
  perspective,
  story,
  activeStoryTitle,
}: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (perspective === "all" && story === "all") return null;

  const handleClearFilter = (filterKey: "perspective" | "story") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterKey);
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("perspective");
    params.delete("story");
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1 px-2.5 bg-secondary/10 rounded-xl border border-secondary/20 text-xs text-muted-foreground animate-in fade-in duration-200">
      <span className="font-semibold text-foreground text-[11px]">Active:</span>
      {perspective !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full inline-block",
            perspective.toLowerCase() === "wire" ? "bg-amber-500" :
            perspective.toLowerCase() === "western" ? "bg-blue-500" :
            perspective.toLowerCase() === "non-western" ? "bg-emerald-500" :
            perspective.toLowerCase() === "eastern" ? "bg-red-500" : "bg-slate-400"
          )} />
          <span className="capitalize font-medium text-[11px]">{perspective}</span>
          <button
            onClick={() => handleClearFilter("perspective")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {story !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="font-medium text-[11px] line-clamp-1 max-w-[150px]" title={activeStoryTitle || story}>
            {activeStoryTitle || story}
          </span>
          <button
            onClick={() => handleClearFilter("story")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      <button
        onClick={handleClearAll}
        className="text-[11px] text-primary hover:underline ml-1 font-semibold cursor-pointer"
      >
        Clear
      </button>
    </div>
  );
}
