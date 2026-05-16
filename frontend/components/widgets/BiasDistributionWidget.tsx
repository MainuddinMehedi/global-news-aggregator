import { getContentInsights } from "@/queries/analytics";
import { cn } from "@/lib/utils";

const BIAS_COLORS: Record<string, string> = {
  Western: "bg-blue-500",
  "Non-Western": "bg-emerald-500",
  Eastern: "bg-red-500",
  Neutral: "bg-muted-foreground/30",
  Unknown: "bg-muted-foreground/10",
};

export async function BiasDistributionWidget() {
  const insights = await getContentInsights();

  if (!insights) return null;

  const total = insights.biasDistribution.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Bias Distribution
      </h3>
      <div className="space-y-4">
        {insights.biasDistribution.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">
                {item.label}
              </span>
              <span className="text-foreground font-mono">{item.count}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  BIAS_COLORS[item.label] || BIAS_COLORS.Unknown,
                )}
                style={{ width: `${(item.count / (total || 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
