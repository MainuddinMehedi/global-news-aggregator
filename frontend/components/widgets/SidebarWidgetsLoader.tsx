import { DiversityInsightWidget } from "@/components/analytics/DiversityInsightWidget";
import { EventClustersWidget } from "@/components/widgets/events/EventClustersWidget";
import { EventRegionWidget } from "@/components/widgets/events/EventRegionWidget";
import { resolveFeedParams } from "@/lib/helpers/feedParamsResolver";
import { buildArticleWhereClause } from "@/queries/article/filter";
import { getCachedUserSettings } from "@/queries/userSettings";

export async function SidebarWidgetsLoader({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const userSettings = await getCachedUserSettings();

  const feedParams = await resolveFeedParams(params, userSettings);
  const where = buildArticleWhereClause(feedParams);

  return (
    <>
      <EventRegionWidget where={where} />
      <EventClustersWidget where={where} />
      <DiversityInsightWidget where={where} />
    </>
  );
}
