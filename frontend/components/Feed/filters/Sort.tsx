import FilterDropdown from "@/components/Feed/filters/FilterDropdown";

export default function Sort({
  defaultSort = "latest",
}: {
  defaultSort?: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground font-medium">Sort:</span>

      <FilterDropdown
        label="Sort"
        paramKey="sort"
        hasAllOption={false}
        defaultValue={defaultSort}
        options={[
          { label: "Latest", value: "latest" },
          { label: "Oldest", value: "oldest" },
          { label: "By Bias", value: "bias" },
        ]}
      />
    </div>
  );
}
