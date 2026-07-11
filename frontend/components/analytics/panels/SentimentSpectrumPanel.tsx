"use client";

import { BarChart } from "@/components/ui/charts/BarChart";
import { METADATA_COLORS } from "@/utils/colors";
import { useRouter } from "next/navigation";
import { PanelShell, SectionHeader } from "../AnalyticsUI";

export function SentimentSpectrumPanel({ data }: { data: any[] }) {
  const router = useRouter();

  const getSentimentColor = (label: string) => {
    switch (label) {
      case "Very Negative":
        return METADATA_COLORS.sentiment.negative;
      case "Negative":
        return METADATA_COLORS.sentiment.negative;
      case "Neutral":
        return METADATA_COLORS.sentiment.neutral;
      case "Positive":
        return METADATA_COLORS.sentiment.positive;
      case "Very Positive":
        return METADATA_COLORS.sentiment.positive;
      default:
        return METADATA_COLORS.sentiment.neutral;
    }
  };

  return (
    <PanelShell>
      <SectionHeader title="Sentiment Spectrum" sub="5-Bucket Distribution" />

      <BarChart
        layout="horizontal"
        data={data.map((item) => ({
          label: item.label,
          count: item.count,
          color: getSentimentColor(item.label),
        }))}
        onItemClick={(label) =>
          router.push(`/?sentiment=${encodeURIComponent(label)}`)
        }
      />
    </PanelShell>
  );
}
