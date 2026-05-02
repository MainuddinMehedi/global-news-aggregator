import { getCategories } from "@/queries/categories";
import CategoryFilterPills from "./CategoryFilterPills";
import Sort from "./Sort";

export default async function Filters({
  totalArticles,
}: {
  totalArticles: number;
}) {
  const categories = await getCategories();

  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <CategoryFilterPills categories={categories} />

      {/* Sort control + article count */}
      <div className="flex items-center justify-between">
        <Sort />

        <p className="text-xs text-muted-foreground leading-none">
          <span className="font-semibold text-foreground tabular-nums">
            {totalArticles}
          </span>{" "}
          articles
        </p>
      </div>
    </div>
  );
}
