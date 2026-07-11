import { FeedContainer } from "@/components/Feed/FeedContainer";
import Filters from "@/components/Feed/filters/Filters";
import { ArticleFeedSkeleton } from "@/components/skeletons/home/ArticleFeedSkeleton";
import { FiltersSkeleton } from "@/components/skeletons/home/FiltersSkeleton";
import { WidgetListSkeleton } from "@/components/skeletons/home/WidgetListSkeleton";
import { SidebarWidgetsLoader } from "@/components/widgets/SidebarWidgetsLoader";
import { Suspense } from "react";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <div className="flex flex-1 w-full">
      {/* Feed: Main content area */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Suspense fallback={<FiltersSkeleton />}>
          <Filters searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<ArticleFeedSkeleton />}>
          <FeedContainer searchParams={searchParams} />
        </Suspense>
      </div>

      {/* Information Widgets — only on xl+ */}
      <div className="hidden xl:flex xl:w-72 shrink-0 p-4 pl-1">
        <aside className="sticky top-5 flex flex-col space-y-4 overflow-y-auto w-full max-h-[calc(100vh-6rem)] scrollbar-hide pb-10">
          <Suspense fallback={<WidgetListSkeleton />}>
            <SidebarWidgetsLoader searchParams={searchParams} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
