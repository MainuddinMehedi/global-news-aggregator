import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getArticles } from "@/queries/articles";
import { getCachedFeedSources } from "@/queries/feedSources";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    let enabledSources: string[] | undefined = undefined;
    let hiddenCategories: string[] | undefined = undefined;
    let take = 20;

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
        if (settings.articlesPerPage) {
          take = settings.articlesPerPage;
        }

        const enabledCustomNames = customSources
          .filter((s: any) => s.enabled)
          .map((s: any) => s.name);

        const globalSources = await getCachedFeedSources();

        const enabledGlobalNames = globalSources
          .filter((s: any) => !disabledBuiltins.includes(s.url))
          .map((s: any) => s.name);

        enabledSources = [...enabledCustomNames, ...enabledGlobalNames];
      }
    }

    const pageParam = searchParams.get("page");

    const data = await getArticles({
      category: searchParams.get("category") ?? "all",
      sort: searchParams.get("sort") ?? "latest",
      search: searchParams.get("search") ?? "",
      region: searchParams.get("region") ?? undefined,
      srcOrigin: searchParams.get("srcOrigin") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      story: searchParams.get("story") ?? undefined,
      bias: searchParams.get("bias") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      page: pageParam ? parseInt(pageParam) : undefined,
      enabledSources,
      hiddenCategories,
      take,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
