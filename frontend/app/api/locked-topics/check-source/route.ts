import { auth } from "@/auth";
import { detectSourceType } from "@/lib/locked-topics/sourceDetection";
import { validateCareersSource } from "@/lib/locked-topics/sources/careers";
import { validateGenericSource } from "@/lib/locked-topics/sources/generic";
import { validateGithubSource } from "@/lib/locked-topics/sources/github";
import { validateRedditSource } from "@/lib/locked-topics/sources/reddit";
import { validateRssSource } from "@/lib/locked-topics/sources/rss";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 },
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({
        valid: false,
        error: "Invalid URL format. Make sure to include http:// or https://",
      });
    }

    const type = detectSourceType(url);

    try {
      let result;

      switch (type) {
        case "github":
          result = await validateGithubSource(url, type);
          break;
        case "reddit":
          result = await validateRedditSource(url, type);
          break;
        case "company_careers":
          result = await validateCareersSource(url, type);
          break;
        case "rss":
          result = await validateRssSource(url, type);
          break;
        default:
          result = await validateGenericSource(url, type);
          break;
      }

      return NextResponse.json(result);
    } catch (fetchErr: any) {
      console.warn("Validation fetch error:", fetchErr.message);
      return NextResponse.json({
        valid: false,
        type,
        error: `Connection failed: ${fetchErr.message}.`,
      });
    }
  } catch (err: any) {
    console.error("Check source route error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
