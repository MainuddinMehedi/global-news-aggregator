"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ActiveFiltersProps {
  category: string;
  region: string;
  origin: string;
  type: string;
  story: string;
  bias?: string;
  scope?: string;
  activeStoryTitle?: string;
}

const ORIGIN_LABELS: Record<string, string> = {
  "North America": "North America",
  "Middle East": "Middle East",
  "Asia-Pacific": "Asia-Pacific",
  "Europe": "Europe",
  "South America": "South America",
  "Africa": "Africa",
  "Global": "Global",
  "Unknown": "Unknown",
};

export default function ActiveFilters({
  category,
  region,
  origin,
  type,
  story,
  bias = "all",
  scope = "all",
  activeStoryTitle,
}: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (
    category === "all" &&
    region === "all" &&
    origin === "all" &&
    type === "all" &&
    story === "all" &&
    bias === "all" &&
    scope === "all"
  ) {
    return null;
  }

  const handleClearFilter = (
    filterKey: "category" | "region" | "origin" | "type" | "story" | "bias" | "scope",
  ) => {
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
    params.delete("bias");
    params.delete("scope");
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 py-1 px-2.5 bg-secondary/20 rounded-xl border border-secondary/30 text-xs text-muted-foreground animate-in fade-in duration-200 max-w-full min-w-0">
      <span className="font-semibold text-foreground text-[11px] shrink-0">
        Active Filters:
      </span>
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
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
            Event Region: {region}
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
            Region: {ORIGIN_LABELS[origin] || origin}
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
      {bias !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            Bias: {bias}
          </span>
          <button
            onClick={() => handleClearFilter("bias")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      {scope !== "all" && (
        <div className="inline-flex items-center space-x-1 bg-card text-foreground border border-border px-2 py-0.5 rounded-lg">
          <span className="capitalize font-medium text-[11px]">
            Scope: {scope}
          </span>
          <button
            onClick={() => handleClearFilter("scope")}
            className="hover:text-destructive transition-colors ml-1 font-bold text-[10px] cursor-pointer"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
      </div>
      <button
        onClick={handleClearAll}
        className="text-[11px] text-primary hover:underline ml-1 font-semibold cursor-pointer shrink-0"
      >
        Clear
      </button>
    </div>
  );
}
