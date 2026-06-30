interface RankedListProps {
  data: {
    label: string;
    count: number;
    percentage: number;
  }[];
  emptyMessage?: string;
  color?: string; // e.g. "emerald-500", or a valid CSS color var like "var(--primary)"
  maxCountOverride?: number; // Optional override for the denominator of the progress bar
}

export function RankedList({
  data,
  emptyMessage = "No items to display.",
  color = "var(--primary)",
  maxCountOverride,
}: RankedListProps) {
  const maxCount = maxCountOverride || (data[0]?.count ?? 1);

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/50 italic py-4 text-center">
        {emptyMessage}
      </p>
    );
  }

  // Determine if color is a tailwind class fragment or a raw CSS value
  const isCssVar =
    color.startsWith("var(") ||
    color.startsWith("#") ||
    color.startsWith("rgb");

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[9px] font-black font-mono text-muted-foreground/40 w-4 text-right">
            {String(i + 1).padStart(2, "0")}
          </span>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground/80 capitalize">
                {item.label.toLowerCase().replace(/_/g, " ")}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 opacity-60 ${!isCssVar ? `bg-${color}` : ""}`}
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: isCssVar ? color : undefined,
                }}
              />
            </div>
          </div>

          <span
            className={`text-[10px] font-black font-mono w-8 text-right opacity-80 ${!isCssVar ? `text-${color}` : ""}`}
            style={{ color: isCssVar ? color : undefined }}
          >
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
