import { Badge } from "@/components/ui/badge";
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

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-8 leading-[1.1]">
        {story.title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Regions Box */}
        <div className="bg-muted/15 rounded-3xl p-6 border border-border/50 backdrop-blur-sm flex flex-col gap-2 md:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-40 shrink-0 flex items-center gap-2">
            <span className="w-2 h-px bg-border" />
            Regions
          </p>
          <div className="flex flex-wrap gap-2">
            {story.regions && story.regions.length > 0 ? (
              story.regions.map((r) => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                >
                  {r}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Global Context</span>
            )}
          </div>
        </div>

        {/* Themes Box */}
        <div className="bg-muted/15 rounded-3xl p-6 border border-border/50 backdrop-blur-sm flex flex-col gap-2 md:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-40 shrink-0 flex items-center gap-2">
            <span className="w-2 h-px bg-border" />
            Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {story.themes && story.themes.length > 0 ? (
              story.themes.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                >
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">General</span>
            )}
          </div>
        </div>

        {/* Reporting Origins Box */}
        <div className="bg-muted/15 rounded-3xl p-6 border border-border/50 backdrop-blur-sm flex flex-col gap-2 md:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-40 shrink-0 flex items-center gap-2">
            <span className="w-2 h-px bg-border" />
            Reporting Origins
          </p>
          <div className="flex flex-wrap gap-2">
            {origins && origins.length > 0 ? (
              origins.map((o) => (
                <Badge
                  key={o}
                  variant="outline"
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-muted-foreground"
                >
                  {o}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Unknown</span>
            )}
          </div>
        </div>

        {/* Intelligence Sources Box */}
        <div className="bg-muted/15 rounded-3xl p-6 border border-border/50 backdrop-blur-sm flex flex-col gap-2 md:gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground w-40 shrink-0 flex items-center gap-2">
            <span className="w-2 h-px bg-border" />
            Intelligence Sources
          </p>
          {sources && sources.length > 0 ? (
            <div className="flex items-center gap-4">
              <SourceAvatarStack sources={sources} max={8} />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {sources.length} {sources.length === 1 ? "Source" : "Sources"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline-block">
                  ({sources.map((s) => s.name).join(", ")})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sources pending</span>
          )}
        </div>
      </div>
    </div>
  );
}
