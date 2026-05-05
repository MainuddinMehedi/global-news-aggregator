import { getStoryClusters } from "@/queries/stories";

export default async function Page() {
  const stories = await getStoryClusters();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
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
          Tier 1 Clusters
        </div>
      </div>

      {/* Grid of Stories */}
      <div className="grid gap-6 xl:grid-cols-2">
        {stories.map((story) => (
          <article
            key={story.id}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card/50 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            {/* Subtle Gradient Glow on Hover */}
            <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Card Header (Title & Summary) */}
            <div className="flex-1 space-y-4 border-b border-border/40 bg-muted/20 px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
                    Story
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {story.articleCount} Articles
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {story.timeWindow}
                </span>
              </div>
              <div className="space-y-2.5">
                <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl group-hover:text-primary transition-colors">
                  {story.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {story.summary}
                </p>
              </div>
            </div>

            {/* Timeline / Key Developments */}
            <div className="px-6 py-6 sm:px-8">
              <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Key Developments
                <div className="h-px flex-1 bg-border/50"></div>
              </div>
              <div className="relative ml-2 space-y-6 border-l-2 border-border/60 pl-6">
                {story.keyDevelopments.map((dev, index) => (
                  <div key={index} className="relative group/timeline">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-muted bg-background ring-4 ring-card transition-colors duration-300 group-hover/timeline:border-primary group-hover/timeline:bg-primary/20" />

                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-foreground/90 transition-colors group-hover/timeline:text-foreground">
                        {dev.title}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground/80">
                        {dev.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
