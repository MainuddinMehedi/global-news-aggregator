import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Clock01Icon } from "@hugeicons/core-free-icons";
import { formatDistanceToNow } from "date-fns";
import type { SystemTaskData } from "@/queries/admin";
import { getStatusBadge, formatTaskName } from "./utils";

interface ActiveWorkersMonitorProps {
  runningTasks: SystemTaskData[];
}

export default function ActiveWorkersMonitor({ runningTasks }: ActiveWorkersMonitorProps) {
  if (runningTasks.length === 0) {
    return (
      <div className="bg-card/30 border border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 shadow-sm">
        <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold text-foreground">No active background tasks</span>
        <span className="text-[10px] text-muted-foreground max-w-sm">
          All crawlers, clustering passes, and scanners are idle. Next run will automatically spawn via pg-boss scheduling.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {runningTasks.map((task) => (
        <Card key={task.id} className="bg-card/45 border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 animate-pulse" />
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">{formatTaskName(task.taskName)}</h4>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} className="w-3.5 h-3.5" />
                  Started {formatDistanceToNow(new Date(task.startedAt))} ago
                </p>
              </div>
              {getStatusBadge(task.status, task.heartbeatAt)}
            </div>
            <div className="flex justify-between items-center text-[10px] border-t border-border/30 pt-3">
              <span className="text-muted-foreground">
                ID: <span className="font-mono text-foreground">{task.id.slice(0, 8)}...</span>
              </span>
              <span className="text-muted-foreground">
                Last Heartbeat:{" "}
                <span className="font-semibold text-foreground">
                  {formatDistanceToNow(new Date(task.heartbeatAt))} ago
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
