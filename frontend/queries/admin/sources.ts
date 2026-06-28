import prisma from "@/lib/prisma";

export async function getFeedSources() {
  try {
    return await prisma.feedSource.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("getFeedSources error:", error);
    return [];
  }
}
