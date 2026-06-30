"use client";

import { DonutChart } from "@/components/ui/charts/DonutChart";
import { DEFAULT_CHART_COLOR, METADATA_COLORS } from "@/utils/colors";
import { useRouter } from "next/navigation";
import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function BiasLeaningPanel({ data }: { data: any[] }) {
  const router = useRouter();

  return (
    <PanelShell>
      <SectionHeader
        title="Bias Leaning Distribution"
        sub="Publisher Ideological Lenses"
      />

      {data.length > 0 ? (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <DonutChart
            onItemClick={(label) =>
              router.push(`/?bias=${encodeURIComponent(label)}`)
            }
            data={data.map((item) => ({
              label: item.label,
              count: item.count,
              percentage: item.percentage,
              color:
                METADATA_COLORS.bias[
                  item.label as keyof typeof METADATA_COLORS.bias
                ] || DEFAULT_CHART_COLOR,
            }))}
          />

          <div className="w-full md:w-48 space-y-2">
            {data.map((item) => {
              const color =
                METADATA_COLORS.bias[
                  item.label as keyof typeof METADATA_COLORS.bias
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
          No bias leaning data available.
        </p>
      )}
    </PanelShell>
  );
}
