import { getCategories } from "@/queries/categories";
import CategoryFilterPills from "./CategoryFilterPills";
import Sort from "./Sort";

export default async function Filters() {
  const categories = await getCategories();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <CategoryFilterPills categories={categories} />

      {/* Sort */}
      <Sort />
    </div>
  );
}
