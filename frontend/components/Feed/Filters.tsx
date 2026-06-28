import { Suspense } from "react";
import { getCategories } from "@/queries/categories";
import CategoryFilter from "./CategoryFilter";
import Sort from "./Sort";
import { ArticleCount } from "./ArticleCount";
import ActiveFilters from "./ActiveFilters";
import FilterPopover from "./FilterPopover";

// TODO: After the new ingestion with the updated category list, make sure if they fit in without scroll. If overflowed, implement scrolling without holding down shift key. So when the user scrolls with the mouse wheel, it should scroll right away.
// TODO: Also Make sure the "all" button is at the first position and the "Others" button is at the last position.

interface FiltersProps {
  category?: string;
  region?: string;
  origin?: string;
  type?: string;
  story?: string;
  bias?: string;
  scope?: string;
  activeStoryTitle?: string;
}

export default async function Filters({
  category = "all",
  region = "all",
  origin = "all",
  type = "all",
  story = "all",
  bias = "all",
  scope = "all",
  activeStoryTitle,
}: FiltersProps) {
  const categories = await getCategories();

  return (
    <div className="space-y-5 w-full">
      {/* Category filter pills */}
      <CategoryFilter categories={categories} />

      {/* Sort control + active filters + live article count */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div className="shrink-0">
          <Sort />
        </div>

        <div className="flex-1 min-w-0 flex justify-center">
          <Suspense fallback={null}>
            <ActiveFilters
              category={category}
              region={region}
              origin={origin}
              type={type}
              story={story}
              bias={bias}
              scope={scope}
              activeStoryTitle={activeStoryTitle}
            />
          </Suspense>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ArticleCount />
          <Suspense fallback={null}>
            <FilterPopover />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
