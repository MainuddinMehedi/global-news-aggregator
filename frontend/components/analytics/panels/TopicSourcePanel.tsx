import { RankedList } from "@/components/ui/charts/RankedList";
import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function TopicSourcePanel({
  data,
  className,
}: {
  data: any[];
  className?: string;
}) {
  return (
    <PanelShell className={className}>
      <SectionHeader title="Your Top Sources" />

      <RankedList
        data={data.map((d) => ({
          label: d.source,
          count: d.count,
          percentage: d.percentage,
        }))}
        color="oklch(from var(--primary) l c h / 0.8)"
        emptyMessage="No sources have been processed for topics yet."
      />
    </PanelShell>
  );
}
