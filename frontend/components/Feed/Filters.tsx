import { getCategories } from "@/queries/categories";
import CategoryFilter from "./CategoryFilter";
import Sort from "./Sort";
import { ArticleCount } from "./ArticleCount";

// TODO: After the new ingestion with the updated category list, make sure if they fit in without scroll. If overflowed, implement scrolling without holding down shift key. So when the user scrolls with the mouse wheel, it should scroll right away.
// TODO: Also Make sure the all button is at the first position and the Others button is at the last position.

export default async function Filters() {
  const categories = await getCategories();

  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <CategoryFilter categories={categories} />

      {/* Sort control + live article count */}
      <div className="flex items-center justify-between">
        <Sort />
        <ArticleCount />
      </div>
    </div>
  );
}
