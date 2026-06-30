"use client";

import { BarChart } from "@/components/ui/charts/BarChart";
import { useRouter } from "next/navigation";
import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function CategoryCoveragePanel({ data }: { data: any[] }) {
  const router = useRouter();

  return (
    <PanelShell>
      <SectionHeader title="Coverage by Category" sub="Top 8 Categories" />

      {data.length > 0 ? (
        <BarChart
          data={data.map((d) => ({
            label: d.name,
            count: d.count,
            percentage: d.percentage,
          }))}
          maxItems={8}
          onItemClick={(label) =>
            router.push(`/?category=${encodeURIComponent(label)}`)
          }
        />
      ) : (
        <p className="text-xs text-muted-foreground/50 italic py-10 text-center">
          No category data available.
        </p>
      )}
    </PanelShell>
  );
}
