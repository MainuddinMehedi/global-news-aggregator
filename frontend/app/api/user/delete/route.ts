import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // This will cascade-delete the user's sessions, accounts, and bookmarks
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
