import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articleBookmarks = await prisma.articleBookmark.findMany({
      where: { userId: session.user.id },
      select: { articleId: true },
    });

    const findingBookmarks = await prisma.findingBookmark.findMany({
      where: { userId: session.user.id },
      select: { findingId: true },
    });

    return NextResponse.json({
      articleIds: articleBookmarks.map((b) => b.articleId),
      findingIds: findingBookmarks.map((b) => b.findingId),
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);

    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, targetId } = body;

    if (type === "article") {
      await prisma.articleBookmark.upsert({
        where: {
          userId_articleId: { userId: session.user.id, articleId: targetId },
        },
        create: {
          userId: session.user.id,
          articleId: targetId,
        },
        update: {},
      });
    } else if (type === "finding") {
      await prisma.findingBookmark.upsert({
        where: {
          userId_findingId: { userId: session.user.id, findingId: targetId },
        },
        create: {
          userId: session.user.id,
          findingId: targetId,
        },
        update: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json(
      { error: "Failed to add bookmark" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, targetId } = body;

    if (type === "article") {
      await prisma.articleBookmark
        .delete({
          where: {
            userId_articleId: { userId: session.user.id, articleId: targetId },
          },
        })
        .catch(() => {}); // Ignore if it doesn't exist
    } else if (type === "finding") {
      await prisma.findingBookmark
        .delete({
          where: {
            userId_findingId: { userId: session.user.id, findingId: targetId },
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);

    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 },
    );
  }
}
