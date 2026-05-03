import { cn } from "@/lib/utils";

const biasDistribution = [
  { label: "Wire/Neutral", count: 0, total: 10, color: "bg-muted-foreground/30" },
  { label: "Western", count: 3, total: 10, color: "bg-blue-500" },
  { label: "Non-Western", count: 3, total: 10, color: "bg-emerald-500" },
  { label: "Eastern", count: 4, total: 10, color: "bg-red-500" },
];

export function BiasDistributionWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Bias Distribution
      </h3>
      <div className="space-y-4">
        {biasDistribution.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">{item.label}</span>
              <span className="text-foreground font-mono">{item.count}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  item.color,
                )}
                style={{ width: `${(item.count / item.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
