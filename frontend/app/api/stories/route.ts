import { NextResponse } from "next/server";
import { getStoryClusters } from "@/queries/stories";

export async function GET() {
  try {
    const stories = await getStoryClusters();
    return NextResponse.json({ stories });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
