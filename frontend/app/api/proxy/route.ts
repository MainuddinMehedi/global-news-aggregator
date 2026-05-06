import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("URL is required", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch original website: ${response.statusText}`, { status: response.status });
    }

    let html = await response.text();

    // Inject base tag so relative assets load correctly from the original origin
    const origin = new URL(url).origin;
    const baseTag = `<base href="${origin}/" />`;
    
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}`);
    } else {
      // If no head, prepend it (unlikely for news sites)
      html = baseTag + html;
    }

    // Return the HTML with X-Frame-Options and CSP headers stripped.
    // We don't set them in the response headers.
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Proxy API Error]:", error);
    return new NextResponse("Internal Server Error fetching original site", { status: 500 });
  }
}
