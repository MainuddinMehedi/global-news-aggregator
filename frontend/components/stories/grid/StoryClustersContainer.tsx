import StoryCard from "@/components/stories/grid/StoryCard";
import { getStoryClusters } from "@/queries/stories";

interface StoryClustersContainerProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function StoryClustersContainer({
  searchParams,
}: StoryClustersContainerProps) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const stories = await getStoryClusters(search || undefined);

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center rounded-[2rem] border border-dashed border-border bg-card/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-transparent opacity-50" />

        <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-t border-primary/40 animate-[spin_3s_linear_infinite_reverse]" />
          <svg
            className="h-8 w-8 text-primary/80 animate-pulse"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl mb-3">
          Synthesizing Global Events
        </h3>
        <p className="max-w-md text-base text-muted-foreground leading-relaxed">
          Our AI is currently analyzing incoming news feeds to identify and
          cluster emerging geopolitical narratives. Intelligence dossiers will
          appear here once significant patterns are detected.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 gap-6 space-y-6">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}
