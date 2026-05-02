import prisma from "@/lib/prisma";

export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map((c) => c.name);
}
