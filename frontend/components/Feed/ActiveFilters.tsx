"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ActiveFiltersProps {
  category: string;
  region: string;
  origin: string;
  type: string;
  story: string;
  activeStoryTitle?: string;
}

const ORIGIN_LABELS: Record<string, string> = {
  "North America": "North American",
  "Middle East": "Middle Eastern",
  "Asia-Pacific": "Asia-Pacific",
  "Europe": "European",
  "Latin America": "Latin American",
  "Africa": "African",
  "Global": "Global",
  "Unknown": "Unknown",
};

export default function ActiveFilters({
  category,
  region,
  origin,
  type,
  story,
  activeStoryTitle,
}: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (category === "all" && region === "all" && origin === "all" && type === "all" && story === "all") return null;

  const handleClearFilter = (filterKey: "category" | "region" | "origin" | "type" | "story") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(filterKey);
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("region");
    params.delete("origin");
    params.delete("type");
    params.delete("story");
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-1 px-2.5 bg-secondary/20 rounded-xl border border-secondary/30 text-xs text-muted-foreground animate-in fade-in duration-200">
      <span className="font-semibold text-foreground text-[11px]">
        Active Filters:
      </span>
      {category !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            {category}
          </span>
          <button
            onClick={() => handleClearFilter("category")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {region !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            Region: {region}
          </span>
          <button
            onClick={() => handleClearFilter("region")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {origin !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            Origin: {ORIGIN_LABELS[origin] || origin}
          </span>
          <button
            onClick={() => handleClearFilter("origin")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {type !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            Type: {type}
          </span>
          <button
            onClick={() => handleClearFilter("type")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {story !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span
            className="font-medium text-[11px] line-clamp-1 max-w-[150px]"
            title={activeStoryTitle || story}
          >
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
