import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await auth();

  // Protect /admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session?.user) {
      // Redirect to home if not authenticated
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    if (session.user.role !== "ADMIN") {
      // Redirect to home if authenticated but not an admin
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // matcher for paths to run middleware on
  matcher: ["/admin/:path*"],
};
