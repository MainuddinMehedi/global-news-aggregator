import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function TopEntitiesPanel({
  data,
  maxEntityCount,
  className,
}: {
  data: any[];
  maxEntityCount: number;
  className?: string;
}) {
  return (
    <PanelShell className={className}>
      <SectionHeader title="Top Entities" />
      {data.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.map((item) => {
            const intensity = Math.round((item.count / maxEntityCount) * 100);
            return (
              <div
                key={item.entity}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-card/30 hover:border-primary/40 transition-colors group"
              >
                <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                  {item.entity}
                </span>
                <span
                  className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `oklch(from var(--primary) l c h / ${(intensity / 100) * 0.25})`,
                    color: `oklch(from var(--primary) l c h / 0.8)`,
                  }}
                >
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/50 italic py-4 text-center">
          No entity data yet. Articles need AI processing.
        </p>
      )}
    </PanelShell>
  );
}
