"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { verifyAdmin } from "./varifyAdmin";

export async function updateUserRole(
  targetUserId: string,
  role: "USER" | "ADMIN",
) {
  await verifyAdmin();

  const session = await auth();
  if (session?.user?.id === targetUserId) {
    return {
      success: false,
      error: "Self-demotion is blocked to prevent administrator lockout.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    await prisma.session.deleteMany({
      where: { userId: targetUserId },
    });

    revalidateTag("users-list", "max");
    return { success: true };
  } catch (error: any) {
    console.error("updateUserRole error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserSuspension(
  targetUserId: string,
  suspended: boolean,
) {
  await verifyAdmin();

  const session = await auth();
  if (session?.user?.id === targetUserId) {
    return {
      success: false,
      error: "Self-suspension is blocked to prevent administrator lockout.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { suspended },
    });

    if (suspended) {
      await prisma.session.deleteMany({
        where: { userId: targetUserId },
      });
    }

    revalidateTag("users-list", "max");
    return { success: true };
  } catch (error: any) {
    console.error("toggleUserSuspension error:", error);
    return { success: false, error: error.message };
  }
}
