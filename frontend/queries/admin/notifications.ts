import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

export async function getAdminNotificationConfigs() {
  "use cache";
  cacheTag("admin-notification-configs");
  cacheLife("hours");

  try {
    return await prisma.adminNotificationConfig.findMany({
      orderBy: { type: "asc" },
    });
  } catch (error) {
    console.error("getAdminNotificationConfigs error:", error);
    return [];
  }
}
