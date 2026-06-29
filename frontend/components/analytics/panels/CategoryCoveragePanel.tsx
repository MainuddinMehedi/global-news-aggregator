import { PanelShell, SectionHeader } from "../AnalyticsUI";
import { CategoryBarChart } from "../../widgets/charts/CategoryBarChart";

export function CategoryCoveragePanel({ data }: { data: any[] }) {
  return (
    <PanelShell>
      <SectionHeader
        title="Coverage by Category"
        sub="Top 8 Categories"
      />
      {data.length > 0 ? (
        <CategoryBarChart data={data} />
      ) : (
        <p className="text-xs text-muted-foreground/50 italic py-10 text-center">
          No category data available.
        </p>
      )}
    </PanelShell>
  );
}
