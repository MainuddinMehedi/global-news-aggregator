import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate Limiting: max 10 requests per minute (polling is 30s = 2 reqs/min)
    const now = Date.now();
    const limit = 10;
    const windowMs = 60 * 1000;

    const rateData = rateLimitMap.get(userId) || { count: 0, windowStart: now };
    if (now - rateData.windowStart > windowMs) {
      rateData.count = 1;
      rateData.windowStart = now;
    } else {
      rateData.count++;
    }
    rateLimitMap.set(userId, rateData);

    if (rateData.count > limit) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
