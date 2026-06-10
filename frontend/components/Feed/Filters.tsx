import { Suspense } from "react";
import { getCategories } from "@/queries/categories";
import CategoryFilter from "./CategoryFilter";
import Sort from "./Sort";
import { ArticleCount } from "./ArticleCount";
import ActiveFilters from "./ActiveFilters";

// TODO: After the new ingestion with the updated category list, make sure if they fit in without scroll. If overflowed, implement scrolling without holding down shift key. So when the user scrolls with the mouse wheel, it should scroll right away.
// TODO: Also Make sure the "all" button is at the first position and the "Others" button is at the last position.

interface FiltersProps {
  category?: string;
  perspective?: string;
  story?: string;
  activeStoryTitle?: string;
}

export default async function Filters({
  category = "all",
  perspective = "all",
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
        <Sort />
        
        <Suspense fallback={null}>
          <ActiveFilters
            perspective={perspective}
            story={story}
            activeStoryTitle={activeStoryTitle}
          />
        </Suspense>

        <ArticleCount />
      </div>
    </div>
  );
}
