import { auth } from "@/auth";
import { getGlobalAnalyticsData } from "@/queries/analytics/global";
import { getUserAnalyticsData } from "@/queries/analytics/user";
import { TopEntitiesPanel, TopicSourcePanel } from "../panels";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function TopicsNarrativesContainer({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const timeRange = typeof params.range === "string" ? params.range : "7d";

  const data = await getGlobalAnalyticsData(timeRange);
  const userData = session?.user?.id
    ? await getUserAnalyticsData(session.user.id, timeRange)
    : null;

  const maxEntityCount = data.topEntities[0]?.count ?? 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {userData && (
        <TopicSourcePanel
          data={userData.topicSourceDistribution}
          className="lg:col-span-1"
        />
      )}

      <TopEntitiesPanel
        data={data.topEntities}
        maxEntityCount={maxEntityCount}
        className={userData ? "lg:col-span-2" : "lg:col-span-3"}
      />
    </div>
  );
}
