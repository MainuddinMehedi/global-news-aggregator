import Link from "next/link";
import { getCategories } from "@/queries/categories";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function CategoryFilter({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const session = await auth();

  let defaultCategory = "all";
  let hiddenCategories: string[] = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { settings: true },
    });
    if (user && user.settings) {
      const settings = user.settings as any;

      defaultCategory = settings.feedDefaultCategory || "all";
      hiddenCategories = settings.hiddenCategories || [];
    }
  }

  const activeCategory =
    typeof params.category === "string" ? params.category : defaultCategory;

  const visibleCategories = categories.filter(
    (cat) => !hiddenCategories.includes(cat),
  );

  // Safely construct searchParams string
  const currentParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value))
        value.forEach((v) => currentParams.append(key, v));
      else currentParams.set(key, value);
    }
  });

  const searchParamsString = currentParams.toString();

  return (
    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide rounded">
      {["all", ...visibleCategories].map((cat) => {
        const linkParams = new URLSearchParams(searchParamsString);

        if (cat === defaultCategory) {
          linkParams.delete("category");
        } else {
          linkParams.set("category", cat);
        }
        linkParams.delete("cursor");

        const href = linkParams.toString() ? `/?${linkParams.toString()}` : "/";

        return (
          <Link
            key={cat}
            href={href}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap capitalize ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </Link>
        );
      })}
    </div>
  );
}
