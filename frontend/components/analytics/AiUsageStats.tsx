import { cn } from "@/lib/utils";
import { getAiUsageStats } from "@/queries/analytics/admin/system";

export async function AiUsageStats() {
  const stats = await getAiUsageStats();

  if (!stats) return null;

  const metrics = [
    {
      label: "Total Tokens",
      value: (stats.totalTokens / 1000).toFixed(1) + "k",
      sub: "Last 7 days",
      color: "text-blue-500",
    },
    {
      label: "Est. Cost",
      value: "$" + stats.totalCost.toFixed(3),
      sub: "AI Enrichment",
      color: "text-emerald-500",
    },
    {
      label: "Success Rate",
      value:
        (
          (stats.successCount / (stats.successCount + stats.failCount || 1)) *
          100
        ).toFixed(1) + "%",
      sub: `${stats.successCount} batches`,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        AI Pipeline (Last 7 Days)
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-muted/30 p-3 rounded-xl border border-border/50"
          >
            <p className="text-[10px] text-muted-foreground font-medium uppercase truncate">
              {m.label}
            </p>
            <p className={cn("text-lg font-bold mt-1", m.color)}>{m.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase px-1">
          Model Breakdown
        </p>
        {Object.entries(stats.models).map(([model, data]) => (
          <div key={model} className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                {model.split("/").pop()}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {(data.tokens / 1000).toFixed(1)}k tokens
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
              ${data.cost.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
