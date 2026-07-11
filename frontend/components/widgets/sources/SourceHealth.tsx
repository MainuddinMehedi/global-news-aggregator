import { RelativeTime } from "@/components/ui/RelativeTime";
import { SourceStatusIndicator } from "@/components/widgets/sources/SourceStatusIndicator";
import { getIngestionStats } from "@/queries/analytics/admin/system";

export async function SourceHealth() {
  const stats = await getIngestionStats();

  if (!stats) return null;

  // Sort sources by last fetch (most recent first)
  const sortedSources = [...stats.sources].sort((a, b) => {
    const timeA = a.lastFetch ? new Date(a.lastFetch).getTime() : 0;
    const timeB = b.lastFetch ? new Date(b.lastFetch).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm h-full">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Source Health (7 Days)
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <p className="text-2xl font-bold text-foreground">
              {stats.sources.length}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">
              Active Sources
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-2xl font-bold text-emerald-500">
              {stats.dedupRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">
              Dedup Rate
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          {sortedSources.slice(0, 6).map((source) => {
            return (
              <div
                key={source.name}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <SourceStatusIndicator lastFetch={source.lastFetch} />
                  <span className="text-sm font-medium text-foreground truncate">
                    {source.name}
                  </span>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-4">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {source.count} articles
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    <RelativeTime date={source.lastFetch} />
                  </span>
                </div>
              </div>
            );
          })}
          {stats.sources.length > 6 && (
            <p className="text-[10px] text-center text-muted-foreground pt-1">
              + {stats.sources.length - 6} more sources
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
