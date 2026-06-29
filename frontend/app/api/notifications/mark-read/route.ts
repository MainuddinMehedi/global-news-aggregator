import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { ids, all } = body as { ids?: string[]; all?: boolean };

    if (all) {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      revalidateTag(`notifications-${userId}`, "max");
      return NextResponse.json({ success: true, message: "All notifications marked as read", markedCount: result.count });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid notification IDs" }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        id: { in: ids },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    revalidateTag(`notifications-${userId}`, "max");
    return NextResponse.json({ success: true, markedCount: result.count });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
