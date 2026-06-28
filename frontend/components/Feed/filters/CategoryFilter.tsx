"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/store";

export default function CategoryFilter({
  categories,
}: {
  categories: string[];
}) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "all";
  const { settings } = useSettings();
  const hiddenCategories = settings?.hiddenCategories || [];

  const visibleCategories = categories.filter(
    (cat) => !hiddenCategories.includes(cat)
  );

  return (
    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide rounded">
      {["all", ...visibleCategories].map((cat) => (
        <Link
          key={cat}
          href={cat === "all" ? "/" : `/?category=${cat}`}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${
            activeCategory === cat
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          {cat === "all" ? "All" : cat}
        </Link>
      ))}
    </div>
  );
}
