import { auth } from "@/auth";
import {
  getGlobalAnalyticsData,
  getUserAnalyticsData,
} from "@/queries/analytics";
import {
  formatCompactNumber,
  getSentimentDisplayProps,
} from "@/utils/analytics";
import { StatCard } from "../AnalyticsUI";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function SummaryStatsContainer({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const timeRange = typeof params.range === "string" ? params.range : "7d";

  const data = await getGlobalAnalyticsData(timeRange);
  const userData = session?.user?.id
    ? await getUserAnalyticsData(session.user.id, timeRange)
    : null;

  const { label: sentimentLabel, color: sentimentColor } =
    getSentimentDisplayProps(data.avgSentiment);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Story Clusters"
        value={formatCompactNumber(data.totalStories)}
        sub="Active narratives"
        accent="#3b82f6"
      />

      {userData && (
        <>
          <StatCard
            label="Locked Topics"
            value={formatCompactNumber(userData.totalTopics)}
            sub="Surveillance ops"
            accent="#10b981"
          />
          <StatCard
            label="Total Findings"
            value={formatCompactNumber(userData.totalFindings)}
            sub="Across all trackers"
            accent="#f59e0b"
          />
        </>
      )}

      <StatCard
        label="Avg. Sentiment"
        value={sentimentLabel}
        sub={
          data.avgSentiment != null
            ? `Score: ${data.avgSentiment.toFixed(3)}`
            : undefined
        }
        accent={sentimentColor}
      />
    </div>
  );
}
