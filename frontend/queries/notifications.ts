import prisma from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { NotificationType, Prisma } from "@news/db";

export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
) {
  "use cache";
  cacheTag(`notifications-${userId}`);
  cacheLife("seconds");

  const { page = 1, limit = 20, unreadOnly = false, type } = options;

  const where: Prisma.NotificationWhereInput = {
    userId,
  };

  if (unreadOnly) {
    where.readAt = null;
  }

  if (type) {
    where.type = type;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: page * limit < total,
  };
}
