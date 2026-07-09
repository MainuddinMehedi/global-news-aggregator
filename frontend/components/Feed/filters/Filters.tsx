import { ArticleCount } from "@/components/Feed/ArticleCount";
import ActiveFilters from "@/components/Feed/filters/ActiveFilters";
import CategoryFilter from "@/components/Feed/filters/CategoryFilter";
import FilterPopover from "@/components/Feed/filters/FilterPopover";
import Sort from "@/components/Feed/filters/Sort";
import { resolveFeedParams } from "@/lib/helpers/feedParamsResolver";
import prisma from "@/lib/prisma";
import { getCachedUserSettings } from "@/queries/userSettings";

interface FiltersProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Filters({ searchParams }: FiltersProps) {
  const params = await searchParams;
  const settings = await getCachedUserSettings();
  const {
    defaultRegion,
    defaultSort,
    defaultCategory,
    category,
    hiddenCategories,
  } = await resolveFeedParams(params, settings);

  return (
    <div className="space-y-5 w-full">
      {/* Category filter pills */}
      <CategoryFilter
        searchParams={params}
        defaultCategory={defaultCategory}
        activeCategory={category}
        hiddenCategories={hiddenCategories}
      />

      {/* Sort control + active filters + live article count */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="shrink-0">
          <Sort defaultSort={defaultSort} />
        </div>

        <div className="flex-1 min-w-0 flex justify-center">
          <ActiveFiltersLoader searchParams={params} />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ArticleCount />
          <FilterPopover defaultRegion={defaultRegion} />
        </div>
      </div>
    </div>
  );
}

async function ActiveFiltersLoader({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  let activeStoryTitle: string | undefined = undefined;

  if (typeof searchParams.story === "string" && searchParams.story !== "all") {
    const cluster = await prisma.storyCluster.findUnique({
      where: { slug: searchParams.story },
      select: { title: true },
    });
    if (cluster) activeStoryTitle = cluster.title;
  }

  return <ActiveFilters activeStoryTitle={activeStoryTitle} />;
}
