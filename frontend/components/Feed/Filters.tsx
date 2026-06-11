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
  activeStoryTitle?: string;
}

export default async function Filters({
  category = "all",
  region = "all",
  origin = "all",
  type = "all",
  story = "all",
  activeStoryTitle,
}: FiltersProps) {
  const categories = await getCategories();

  return (
    <div className="space-y-5 w-full">
      {/* Category filter pills */}
      <CategoryFilter categories={categories} />

      {/* Sort control + active filters + live article count */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Sort />
          <div className="h-6 w-px bg-border hidden sm:block" />


          <Suspense fallback={null}>
            <FilterPopover />
          </Suspense>
          <Suspense fallback={null}>
            <ActiveFilters
              category={category}
              region={region}
              origin={origin}
              type={type}
              story={story}
              activeStoryTitle={activeStoryTitle}
            />
          </Suspense>
        </div>

        <ArticleCount />
      </div>
    </div>
  );
}
