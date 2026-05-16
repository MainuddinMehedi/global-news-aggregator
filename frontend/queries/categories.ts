import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { CANONICAL_CATEGORIES } from "@/lib/constants";

export async function getCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const categories = await prisma.category.findMany({
    where: { name: { in: CANONICAL_CATEGORIES } },
  });

  const availableCategories = new Set(categories.map((c) => c.name));

  return CANONICAL_CATEGORIES.filter((category) =>
    availableCategories.has(category),
  );
}
