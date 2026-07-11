import { RankedList } from "@/components/ui/charts/RankedList";
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

      <RankedList
        data={data.map((d) => ({
          label: d.country,
          count: d.count,
          percentage: d.percentage,
        }))}
        maxCountOverride={maxCountryCount}
        emptyMessage="No geography data available."
      />
    </PanelShell>
  );
}
