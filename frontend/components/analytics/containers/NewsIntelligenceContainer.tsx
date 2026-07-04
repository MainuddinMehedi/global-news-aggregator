import { getGlobalAnalyticsData } from "@/queries/analytics";
import {
  BiasLeaningPanel,
  CategoryCoveragePanel,
  CoverageScopePanel,
  EventRegionPanel,
  SentimentSpectrumPanel,
  SourceGeographyPanel,
} from "../panels";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function NewsIntelligenceContainer({ searchParams }: Props) {
  const params = await searchParams;
  const timeRange = typeof params.range === "string" ? params.range : "7d";

  const data = await getGlobalAnalyticsData(timeRange);
  const maxCountryCount = data.topSourceCountries[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventRegionPanel data={data.eventRegionDistribution} />
        <SentimentSpectrumPanel data={data.sentimentDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BiasLeaningPanel data={data.biasGroupDistribution} />
        <CoverageScopePanel data={data.coverageScopeDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceGeographyPanel
          data={data.topSourceCountries}
          maxCountryCount={maxCountryCount}
        />
        <CategoryCoveragePanel data={data.categoryBreakdown} />
      </div>
    </div>
  );
}
