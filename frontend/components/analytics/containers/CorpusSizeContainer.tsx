import { getGlobalAnalyticsData } from "@/queries/analytics/global";
import { formatCompactNumber } from "@/utils/analytics";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function CorpusSizeContainer({ searchParams }: Props) {
  const params = await searchParams;
  const timeRange = typeof params.range === "string" ? params.range : "7d";

  const data = await getGlobalAnalyticsData(timeRange);

  return (
    <div className="text-left md:text-right">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-1">
        Corpus Size
      </p>
      <p className="text-5xl font-black font-mono tracking-tighter text-foreground">
        {formatCompactNumber(data.totalArticles)}
      </p>
      <p className="text-[10px] text-muted-foreground font-mono mt-1">
        processed articles
      </p>
    </div>
  );
}
