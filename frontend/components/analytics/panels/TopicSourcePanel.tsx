import { PanelShell, SectionHeader } from "../AnalyticsUI";
import { TopicSourceDistributionChart } from "../../widgets/charts/TopicSourceDistributionChart";

export function TopicSourcePanel({
  data,
  className,
}: {
  data: any[];
  className?: string;
}) {
  return (
    <PanelShell className={className}>
      <SectionHeader title="Your Tracking Sources" />
      <TopicSourceDistributionChart data={data} />
    </PanelShell>
  );
}
