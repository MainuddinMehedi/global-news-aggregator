import { Suspense } from "react";
import { StoryClustersContainer } from "@/components/stories";
import { StoriesGridSkeleton } from "@/components/skeletons/stories/StoriesGridSkeleton";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Static Shell Header (Instant Render) */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-semibold">
            Story clusters
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Emerging Narratives
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Grouped articles and timeline developments let you scan the most
            important geopolitical stories at a glance.
          </p>
        </div>

        {/* TODO: Some sorting options can be wired up here. */}
        <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
          </span>
          Active Story Clusters
        </div>
      </div>

      {/* Dynamic Content Boundary */}
      <Suspense fallback={<StoriesGridSkeleton />}>
        <StoryClustersContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
