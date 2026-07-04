import { auth } from "@/auth";
import { LockedTopicsContainer } from "@/components/locked-topics/grid/LockedTopicsContainer";
import CreateTopicModal from "@/components/locked-topics/modals/CreateTopicModal/CreateTopicModal";
import LockedTopicGridSkeleton from "@/components/skeletons/locked-topics/LockedTopicGridSkeleton";
import { RssLockedIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LockedTopicsPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Static Shell Header (Instant Render) */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <HugeiconsIcon icon={RssLockedIcon} className="h-4 w-4" />
            Active Surveillance
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Locked Topics
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Pin specific themes to ensure they are persistently tracked. The
            system acts as your personal researcher, monitoring all sources
            every 2 hours.
          </p>
        </div>

        <CreateTopicModal />
      </div>

      {/* Dynamic Content Boundary */}
      <Suspense fallback={<LockedTopicGridSkeleton />}>
        <LockedTopicsContainer userId={userId} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
