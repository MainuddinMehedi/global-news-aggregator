import { PanelShell, SectionHeader } from "../AnalyticsUI";
import { BiasDonutChart } from "../../widgets/charts/BiasDonutChart";

export function BiasLeaningPanel({ data }: { data: any[] }) {
  return (
    <PanelShell>
      <SectionHeader
        title="Bias Leaning Distribution"
        sub="Publisher Ideological Lenses"
      />
      {data.length > 0 ? (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <BiasDonutChart
            filterParam="bias"
            data={data.map((item) => ({
              label: item.label,
              count: item.count,
              percentage: item.percentage,
              color:
                item.label === "Centrist"
                  ? "#10b981"
                  : item.label === "Left-leaning"
                    ? "#3b82f6"
                    : item.label === "Right-leaning"
                      ? "#ef4444"
                      : item.label === "State-Aligned"
                        ? "#f59e0b"
                        : item.label === "State-Controlled"
                          ? "#8b5cf6"
                          : "#6b7280",
            }))}
          />
          <div className="w-full md:w-48 space-y-2">
            {data.map((item) => {
              const color =
                item.label === "Centrist"
                  ? "#10b981"
                  : item.label === "Left-leaning"
                    ? "#3b82f6"
                    : item.label === "Right-leaning"
                      ? "#ef4444"
                      : item.label === "State-Aligned"
                        ? "#f59e0b"
                        : item.label === "State-Controlled"
                          ? "#8b5cf6"
                          : "#6b7280";
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-black font-mono text-foreground/80">
                    {item.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50 italic py-10 text-center">
          No bias leaning data available.
        </p>
      )}
    </PanelShell>
  );
}
