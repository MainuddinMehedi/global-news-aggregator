import { getContentInsights } from "@/queries/analytics";
import EventRegionList from "@/components/widgets/events/EventRegionList";

export async function EventRegionWidget() {
  const insights = await getContentInsights();

  if (!insights) return null;

  const total = insights.eventRegionDistribution.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
        Event Region
      </h3>
      <EventRegionList distribution={insights.eventRegionDistribution} total={total} />
    </div>
  );
}
