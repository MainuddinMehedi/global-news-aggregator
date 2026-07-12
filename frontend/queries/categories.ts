import { CANONICAL_CATEGORIES } from "@/constants/canonical";
import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  try {
    const categories = await prisma.category.findMany({
      where: { name: { in: CANONICAL_CATEGORIES } },
    });

    const availableCategories = new Set(categories.map((c) => c.name));

    return CANONICAL_CATEGORIES.filter((category) =>
      availableCategories.has(category),
    );
  } catch (error) {
    console.error("getCategories error:", error);
    return CANONICAL_CATEGORIES;
  }
}
