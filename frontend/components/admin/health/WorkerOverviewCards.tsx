import { Card, CardContent } from "@/components/ui/card";
import type { SystemHealthOverview } from "@/queries/admin/health";

interface WorkerOverviewCardsProps {
  healthOverview: SystemHealthOverview;
}

export default function WorkerOverviewCards({ healthOverview }: WorkerOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Workers
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {healthOverview.activeWorkersCount}
            </span>
            <span className="flex h-3 w-3 relative">
              {healthOverview.activeWorkersCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  healthOverview.activeWorkersCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
              ></span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-none">
            Background executors running now
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ingestion Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {healthOverview.ingestionRatePerHour}
            </span>
            <span className="text-xs font-semibold text-emerald-500">/ hr</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-none">
            Processed articles in past 60 mins
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Deduplication Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {healthOverview.dedupEfficiency}%
            </span>
            <span className="text-xs font-semibold text-primary">Efficiency</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-none">
            Duplicate articles filtered in 24h
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/40 backdrop-blur-sm border-border/40 hover:border-border transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Failures (24h)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {healthOverview.totalFailures24h}
            </span>
            {healthOverview.totalFailures24h > 0 ? (
              <span className="text-xs font-bold text-destructive">CRITICAL</span>
            ) : (
              <span className="text-xs font-bold text-emerald-500">HEALTHY</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-none">
            Failed background worker attempts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
