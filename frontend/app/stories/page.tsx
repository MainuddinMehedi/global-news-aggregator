import { Badge } from "@/components/ui/badge";
import { getStoryClusters } from "@/queries/stories";
import { Clock01Icon, Earth, TradeUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

export default async function Page() {
  const stories = await getStoryClusters();

  // Helper for impact color
  const getImpactColor = (impact?: string | null) => {
    switch (impact?.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

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
          Active Story Clusters
        </div>
      </div>

      {/* Grid of Stories or Empty State */}
      {stories.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.slug}`}
              className="block outline-none"
            >
              <article className="group h-full relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card/50 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                {/* Subtle Gradient Glow on Hover */}
                <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Card Header (Title & Summary & Intelligence) */}
                <div className="flex-1 space-y-4 border-b border-border/40 bg-muted/20 px-6 py-6 sm:px-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      {story.impact ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-widest ${getImpactColor(story.impact)}`}
                        >
                          {story.impact}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/10"
                        >
                          Story
                        </Badge>
                      )}

                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <HugeiconsIcon icon={Earth} className="w-3 h-3" />
                        {story.articleCount} Articles
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {story.status && (
                        <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                          <HugeiconsIcon
                            icon={TradeUpIcon}
                            className="w-3 h-3"
                          />
                          {story.status}
                        </span>
                      )}
                      <span className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1">
                        <HugeiconsIcon icon={Clock01Icon} className="w-3 h-3" />
                        {story.timeWindow}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl group-hover:text-primary transition-colors">
                      {story.title}
                    </h2>

                    {/* Context Strip */}
                    <div className="flex flex-col items-start gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1">
                      {story.regions && story.regions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/70">
                            Regions:
                          </span>
                          {story.regions.slice(0, 3).join(", ")}
                          {story.regions.length > 3 && ", ..."}
                        </div>
                      )}
                      {story.themes && story.themes.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground/70">
                            Themes:
                          </span>
                          {story.themes.slice(0, 3).join(", ")}
                          {story.themes.length > 3 && ", ..."}
                        </div>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2 mt-2">
                      {story.summary}
                    </p>
                  </div>
                </div>

                {/* Timeline / Key Developments */}
                <div className="px-6 py-6 sm:px-8 bg-card/20">
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
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 px-4 text-center rounded-[2rem] border border-dashed border-border bg-card/30 backdrop-blur-sm shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
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
