import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function SourceGeographyPanel({
  data,
  maxCountryCount,
}: {
  data: any[];
  maxCountryCount: number;
}) {
  return (
    <PanelShell>
      <SectionHeader title="Source Geography" />
      {data.length > 0 ? (
        <div className="space-y-2.5">
          {data.map((item, i) => (
            <div key={item.country} className="flex items-center gap-3">
              <span className="text-[9px] font-black font-mono text-muted-foreground/40 w-4 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground/80">
                    {item.country}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 w-full bg-border/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-1000"
                    style={{
                      width: `${(item.count / maxCountryCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-black font-mono text-primary/60 w-8 text-right">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50 italic py-10 text-center">
          No geography data available.
        </p>
      )}
    </PanelShell>
  );
}
