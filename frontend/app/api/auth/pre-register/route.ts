import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and Name are required" },
        { status: 400 }
      );
    }

    // Upsert user to save the name in the DB.
    // If the user already exists, update their name.
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Pre-registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
