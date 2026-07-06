import FilterDropdown from "@/components/Feed/filters/FilterDropdown";
import { Suspense } from "react";

export default function Sort() {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground font-medium">Sort:</span>

      <Suspense
        fallback={
          <div className="w-[115px] h-8 bg-muted animate-pulse rounded-md" />
        }
      >
        <FilterDropdown
          label="Sort"
          paramKey="sort"
          hasAllOption={false}
          options={[
            { label: "Latest", value: "latest" },
            { label: "Oldest", value: "oldest" },
            { label: "By Bias", value: "bias" },
          ]}
        />
      </Suspense>
    </div>
  );
}
