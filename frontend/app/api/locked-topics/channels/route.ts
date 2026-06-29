import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// This route is for getting the available notification channels. To let the user choose whether they want ot use this channel or not.
// TODO: in real version reads from process.env

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Stub implementation - in real version reads from process.env
    return NextResponse.json({
      discord: !!process.env.DISCORD_WEBHOOK_URL,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 },
    );
  }
}
