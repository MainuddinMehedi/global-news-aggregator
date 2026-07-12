"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterPill from "./FilterPill";

interface ActiveFiltersProps {
  activeStoryTitle?: string;
}

export default function ActiveFilters({
  activeStoryTitle,
}: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const srcOrigin = searchParams.get("srcOrigin");
  const type = searchParams.get("type");
  const story = searchParams.get("story");
  const bias = searchParams.get("bias");
  const scope = searchParams.get("scope");

  if (
    !category &&
    !region &&
    !srcOrigin &&
    !type &&
    !story &&
    !bias &&
    !scope
  ) {
    return null;
  }

  const handleClearFilter = (
    filterKey:
      | "category"
      | "region"
      | "srcOrigin"
      | "type"
      | "story"
      | "bias"
      | "scope",
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
    params.delete("srcOrigin");
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
        {category && (
          <FilterPill
            value={category}
            onClear={() => handleClearFilter("category")}
          />
        )}
        {region && (
          <FilterPill
            label="Event Region"
            value={region}
            onClear={() => handleClearFilter("region")}
          />
        )}
        {srcOrigin && (
          <FilterPill
            label="Source Origin"
            value={srcOrigin}
            onClear={() => handleClearFilter("srcOrigin")}
          />
        )}
        {type && (
          <FilterPill
            label="Type"
            value={type}
            onClear={() => handleClearFilter("type")}
          />
        )}
        {story && (
          <FilterPill
            value={activeStoryTitle || story}
            onClear={() => handleClearFilter("story")}
          />
        )}
        {bias && (
          <FilterPill
            label="Bias"
            value={bias}
            onClear={() => handleClearFilter("bias")}
          />
        )}
        {scope && (
          <FilterPill
            label="Scope"
            value={scope}
            onClear={() => handleClearFilter("scope")}
          />
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
