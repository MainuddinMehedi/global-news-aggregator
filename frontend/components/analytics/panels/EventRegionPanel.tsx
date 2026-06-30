import { PanelShell, SectionHeader } from "../AnalyticsUI";
import { BiasDonutChart } from "../../widgets/charts/BiasDonutChart";
import { METADATA_COLORS, DEFAULT_CHART_COLOR } from "@/utils/colors";

export function EventRegionPanel({ data }: { data: any[] }) {
  return (
    <PanelShell>
      <SectionHeader
        title="Event Region Distribution"
        sub="Interactive Donut Analysis"
      />

      {data.length > 0 ? (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <BiasDonutChart
            filterParam="region"
            data={data.map((item) => ({
              label: item.label,
              count: item.count,
              percentage: item.percentage,
              color:
                METADATA_COLORS.region[
                  item.label as keyof typeof METADATA_COLORS.region
                ] || DEFAULT_CHART_COLOR,
            }))}
          />

          <div className="w-full md:w-48 space-y-2">
            {data.map((item) => {
              const color =
                METADATA_COLORS.region[
                  item.label as keyof typeof METADATA_COLORS.region
                ] || DEFAULT_CHART_COLOR;

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
          No region data available.
        </p>
      )}
    </PanelShell>
  );
}
