import { ArticleCount } from "@/components/Feed/ArticleCount";
import ActiveFilters from "@/components/Feed/filters/ActiveFilters";
import CategoryFilter from "@/components/Feed/filters/CategoryFilter";
import FilterPopover from "@/components/Feed/filters/FilterPopover";
import Sort from "@/components/Feed/filters/Sort";
import prisma from "@/lib/prisma";
import { Suspense } from "react";

interface FiltersProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  defaultRegion?: string;
  defaultSort?: string;
}

export default function Filters({
  searchParams,
  defaultRegion = "all",
  defaultSort = "latest",
}: FiltersProps) {
  return (
    <div className="space-y-5 w-full">
      {/* Category filter pills */}
      <Suspense
        fallback={
          <div className="h-8 w-full animate-pulse bg-muted rounded-md" />
        }
      >
        <CategoryFilter searchParams={searchParams} />
      </Suspense>

      {/* Sort control + active filters + live article count */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="shrink-0">
          <Sort defaultSort={defaultSort} />
        </div>

        <div className="flex-1 min-w-0 flex justify-center">
          <Suspense fallback={null}>
            <ActiveFiltersLoader searchParams={searchParams} />
          </Suspense>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ArticleCount />
          <FilterPopover defaultRegion={defaultRegion} />
        </div>
      </div>
    </div>
  );
}

async function ActiveFiltersLoader({ searchParams }: FiltersProps) {
  const params = await searchParams;
  let activeStoryTitle: string | undefined = undefined;

  if (typeof params.story === "string" && params.story !== "all") {
    const cluster = await prisma.storyCluster.findUnique({
      where: { slug: params.story },
      select: { title: true },
    });
    if (cluster) activeStoryTitle = cluster.title;
  }

  return <ActiveFilters activeStoryTitle={activeStoryTitle} />;
}
