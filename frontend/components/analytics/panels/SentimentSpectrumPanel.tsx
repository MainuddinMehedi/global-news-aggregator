import { PanelShell, SectionHeader } from "../AnalyticsUI";
import { SentimentBarChart } from "../../widgets/charts/SentimentBarChart";

export function SentimentSpectrumPanel({ data }: { data: any[] }) {
  return (
    <PanelShell>
      <SectionHeader
        title="Sentiment Spectrum"
        sub="5-Bucket Distribution"
      />
      <SentimentBarChart data={data} />
    </PanelShell>
  );
}
