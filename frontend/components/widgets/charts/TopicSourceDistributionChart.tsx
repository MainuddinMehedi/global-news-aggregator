interface Props {
  data: { source: string; count: number; percentage: number }[];
}

export function TopicSourceDistributionChart({ data }: Props) {
  const maxCount = data[0]?.count ?? 1;

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/50 italic py-4 text-center">
        No sources have been processed for topics yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={item.source} className="flex items-center gap-3">
          <span className="text-[9px] font-black font-mono text-muted-foreground/40 w-4 text-right">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground/80 capitalize">
                {item.source.toLowerCase().replace(/_/g, " ")}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500/60 transition-all duration-1000"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-[10px] font-black font-mono text-emerald-500/60 w-8 text-right">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
