import { ImpactBadge } from "@/components/stories/widgets/ImpactBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Earth, TradeUpIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { SourceAvatarStack } from "@/components/ui/SourceAvatar";
import { formatTimeWindow } from "@/lib/utils";
import KeyDevelopmentsTimeline from "@/components/stories/timeline/KeyDevelopmentsTimeline";

interface KeyDevelopment {
  title: string;
  date: string;
}

interface Source {
  name: string;
  url: string;
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
    sources: Source[];
    origins?: string[];
    keyDevelopments: KeyDevelopment[];
  };
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <article className="break-inside-avoid group max-h-fit relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card/50 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex-1 space-y-4 border-b border-border/40 bg-muted/20 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 w-full">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImpactBadge impact={story.impact} />

              <span className="text-xs 2xl:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <HugeiconsIcon
                  icon={Earth}
                  className="w-3.5 h-3.5 2xl:w-4 2xl:h-4"
                />
                {story.articleCount} Articles
              </span>
            </div>

            {story.status && (
              <span className="text-xs 2xl:text-sm font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                <HugeiconsIcon
                  icon={TradeUpIcon}
                  className="w-3.5 h-3.5 2xl:w-4 2xl:h-4"
                />
                {story.status}
              </span>
            )}
          </div>

          <span className="ml-auto text-xs 2xl:text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 whitespace-nowrap text-right shrink-0">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="w-3.5 h-3.5 2xl:w-4 2xl:h-4"
            />
            {formatTimeWindow(story.timeWindow)}
          </span>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-xl sm:text-2xl md:text-[28px] xl:text-3xl 2xl:text-4xl font-extrabold leading-tight text-foreground tracking-tight">
            <Link
              href={`/stories/${story.slug}`}
              className="hover:text-primary transition-colors"
            >
              {story.title}
            </Link>
          </h2>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-2 text-[10px] 2xl:text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
            {story.regions && story.regions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-foreground/40 font-black">/</span>
                <span className="text-foreground/70">Regions:</span>
                <span className="text-muted-foreground/60">
                  {story.regions.slice(0, 3).join(", ")}
                  {story.regions.length > 3 && ", ..."}
                </span>
              </div>
            )}
            {story.themes && story.themes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-foreground/40 font-black">/</span>
                <span className="text-foreground/70">Themes:</span>
                <span className="text-muted-foreground/60">
                  {story.themes.slice(0, 3).join(", ")}
                  {story.themes.length > 3 && ", ..."}
                </span>
              </div>
            )}
            {story.sources && story.sources.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-foreground/40 font-black">/</span>
                <span className="text-foreground/70">Sources:</span>
                <SourceAvatarStack
                  sources={story.sources}
                  max={4}
                  className="py-0.5"
                />
              </div>
            )}
            {story.origins && story.origins.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-foreground/40 font-black">/</span>
                <span className="text-foreground/70">Origins:</span>
                <span className="text-muted-foreground/60">
                  {story.origins.slice(0, 3).join(", ")}
                  {story.origins.length > 3 && ", ..."}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm 2xl:text-base leading-relaxed text-muted-foreground/90 font-medium line-clamp-2 2xl:line-clamp-3 mt-2">
            {story.summary}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 bg-card/20">
        <KeyDevelopmentsTimeline
          developments={story.keyDevelopments}
          limit={6}
          showTitle={true}
        />
      </div>
    </article>
  );
}
