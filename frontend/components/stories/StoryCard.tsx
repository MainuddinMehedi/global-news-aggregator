import { Badge } from "@/components/ui/badge";
import { ImpactBadge } from "./ImpactBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Earth, TradeUpIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";

interface KeyDevelopment {
  title: string;
  date: string;
}

interface StoryCardProps {
  story: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    impact?: string | null;
    articleCount: number;
    timeWindow: string;
    status?: string | null;
    regions?: string[];
    themes?: string[];
    keyDevelopments: KeyDevelopment[];
  };
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      key={story.id}
      href={`/stories/${story.slug}`}
      className="block outline-none"
    >
      <article className="group h-full relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card/50 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="flex-1 space-y-4 border-b border-border/40 bg-muted/20 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <ImpactBadge impact={story.impact} />

              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <HugeiconsIcon icon={Earth} className="w-3 h-3" />
                {story.articleCount} Articles
              </span>
            </div>

            <div className="flex items-center gap-3">
              {story.status && (
                <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                  <HugeiconsIcon icon={TradeUpIcon} className="w-3 h-3" />
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

        <div className="px-6 py-6 sm:px-8 bg-card/20">
          <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Key Developments
            <div className="h-px flex-1 bg-border/50"></div>
          </div>
          <div className="relative ml-2 space-y-6 border-l-2 border-border/60 pl-6">
            {story.keyDevelopments.map((dev, index) => (
              <div key={index} className="relative group/timeline">
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
  );
}