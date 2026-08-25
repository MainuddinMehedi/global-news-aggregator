import { ImpactBadge } from "@/components/stories/ImpactBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Earth, TradeUpIcon } from "@hugeicons/core-free-icons";
import { SourceAvatarStack } from "@/components/ui/SourceAvatar";

interface Source {
  name: string;
  url: string;
}

interface StoryHeroProps {
  story: {
    title: string;
    summary: string;
    whyItMatters?: string | null;
    impact?: string | null;
    updatedAt: string | Date;
    articleCount: number;
    status?: string | null;
    regions?: string[];
    themes?: string[];
    topSources?: string[];
  };
  sources: Source[];
  origins?: string[];
}

export default function StoryHero({ story, sources, origins }: StoryHeroProps) {
  return (
    <div className="rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <ImpactBadge impact={story.impact} />

        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
          Updated {new Date(story.updatedAt).toLocaleDateString()}
        </span>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <HugeiconsIcon icon={Earth} className="h-3.5 w-3.5" />
          {story.articleCount} Articles
        </span>
        {story.status && (
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2 ml-auto">
            <HugeiconsIcon icon={TradeUpIcon} className="h-4 w-4" />
            {story.status}
          </span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
        {story.title}
      </h1>

      <div className="flex flex-col items-start gap-y-2.5 text-xs 2xl:text-sm font-bold tracking-wider text-muted-foreground pt-4 border-t border-border/40">
        {story.regions && story.regions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground/40 font-black">/</span>
            <span className="text-foreground/70">Regions:</span>
            <span className="text-muted-foreground/60">
              {story.regions.join(", ")}
            </span>
          </div>
        )}

        {story.themes && story.themes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground/40 font-black">/</span>
            <span className="text-foreground/70">Themes:</span>
            <span className="text-muted-foreground/60">
              {story.themes.join(", ")}
            </span>
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground/40 font-black">/</span>
            <span className="text-foreground/70">Sources:</span>
            <SourceAvatarStack sources={sources} max={6} className="py-0.5" />
            <span className="text-muted-foreground/60 hidden sm:inline-block">
              ({sources.map((s) => s.name).join(", ")})
            </span>
          </div>
        )}

        {origins && origins.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground/40 font-black">/</span>
            <span className="text-foreground/70">Origins:</span>
            <span className="text-muted-foreground/60">
              {origins.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
