import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NotificationType, Prisma } from "@news/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    
    const typeParam = searchParams.get("type");
    let type: NotificationType | undefined;
    if (typeParam) {
      if (Object.values(NotificationType).includes(typeParam as any)) {
        type = typeParam as NotificationType;
      } else {
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
      }
    }

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

    const hasMore = page * limit < total;

    return NextResponse.json({
      notifications,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
