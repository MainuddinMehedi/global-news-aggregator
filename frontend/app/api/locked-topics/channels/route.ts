import { NextRequest, NextResponse } from "next/server";

// This route is for getting the available notification channels. To let the user choose whether they want ot use this channel or not.
// TODO: in real version reads from process.env

export async function GET(req: NextRequest) {
  try {
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
