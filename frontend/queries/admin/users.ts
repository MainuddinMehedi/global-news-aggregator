import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma } from "@news/db";

export interface UserAdminData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  suspended: boolean;
  createdAt: Date;
}

export async function getUsers(searchQuery?: string): Promise<UserAdminData[]> {
  "use cache";
  cacheTag("users-list");
  cacheLife("minutes");

  try {
    const whereClause: Prisma.UserWhereInput = {};

    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.trim();
      whereClause.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        suspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users as UserAdminData[];
  } catch (error) {
    console.error("getUsers error:", error);
    return [];
  }
}
