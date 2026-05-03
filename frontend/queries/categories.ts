import { cacheLife, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";

export async function getCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map((c) => c.name);
}
