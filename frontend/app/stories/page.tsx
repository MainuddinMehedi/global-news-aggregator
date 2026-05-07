import { getStoryClusters } from "@/queries/stories";
import { StoryCard } from "@/components/stories";

export default async function Page() {
  const stories = await getStoryClusters();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

        <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
          </span>
          Active Story Clusters
        </div>
      </div>

      {stories.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}