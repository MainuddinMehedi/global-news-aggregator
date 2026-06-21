import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/queries/articles";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { BUILTIN_SOURCES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    let enabledSources: string[] | undefined = undefined;
    let hiddenCategories: string[] | undefined = undefined;

    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { settings: true },
      });
      if (user) {
        const settings = (user.settings || {}) as any;
        const customSources = settings.customSources || [];
        const disabledBuiltins = settings.disabledBuiltinSources || [];
        hiddenCategories = settings.hiddenCategories || [];

        const enabledCustomNames = customSources
          .filter((s: any) => s.enabled)
          .map((s: any) => s.name);

        const enabledBuiltinNames = BUILTIN_SOURCES
          .filter((s) => !disabledBuiltins.includes(s.url))
          .map((s) => s.name);

        enabledSources = [...enabledCustomNames, ...enabledBuiltinNames];
      }
    }

    const data = await getArticles({
      category:    searchParams.get("category")    ?? "all",
      sort:        searchParams.get("sort")        ?? "latest",
      search:      searchParams.get("search")      ?? "",
      region:      searchParams.get("region")      ?? undefined,
      origin:      searchParams.get("origin")      ?? undefined,
      type:        searchParams.get("type")        ?? undefined,
      story:       searchParams.get("story")       ?? undefined,
      bias:        searchParams.get("bias")        ?? undefined,
      scope:       searchParams.get("scope")       ?? undefined,
      cursor:      searchParams.get("cursor")      ?? undefined,
      enabledSources,
      hiddenCategories,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

