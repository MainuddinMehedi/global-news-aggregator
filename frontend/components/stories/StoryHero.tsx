import { Badge } from "@/components/ui/badge";
import { ImpactBadge } from "./ImpactBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, Earth, TradeUpIcon } from "@hugeicons/core-free-icons";

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
}

export default function StoryHero({ story }: StoryHeroProps) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4 bg-muted/20 rounded-2xl p-5 border border-border/50 backdrop-blur-sm group">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <span className="w-4 h-px bg-border group-hover:w-8 transition-all" />
            Regions
          </p>
          <div className="flex flex-wrap gap-2">
            {story.regions && story.regions.length > 0 ? (
              story.regions.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Global Context
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-muted/20 rounded-2xl p-5 border border-border/50 backdrop-blur-sm group">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <span className="w-4 h-px bg-border group-hover:w-8 transition-all" />
            Themes
          </p>
          <div className="flex flex-wrap gap-2">
            {story.themes && story.themes.length > 0 ? (
              story.themes.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">General</span>
            )}
          </div>
        </div>

        <div className="space-y-4 bg-muted/20 rounded-2xl p-6 border border-border/50 backdrop-blur-sm group">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <span className="w-4 h-px bg-border group-hover:w-8 transition-all" />
            Intelligence Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {story.topSources && story.topSources.length > 0 ? (
              story.topSources.slice(0, 4).map((s) => (
                <Badge key={s} variant="outline" className="bg-background/50">
                  {s}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Sources pending
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
