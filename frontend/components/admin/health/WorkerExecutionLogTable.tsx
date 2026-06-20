import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import type { SystemTaskData } from "@/queries/admin";
import { getStatusBadge, formatTaskName, formatDuration, formatMetadata } from "./utils";

interface WorkerExecutionLogTableProps {
  taskLogs: SystemTaskData[];
}

export default function WorkerExecutionLogTable({ taskLogs }: WorkerExecutionLogTableProps) {
  return (
    <Card className="bg-card/45 border-border/50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="font-bold text-sm text-foreground">Worker Execution History Log</h3>
        <p className="text-xs text-muted-foreground">Chronological audit ledger of completed background tasks.</p>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/30 text-muted-foreground font-semibold">
                <th className="px-5 py-3">Task Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Run Analytics & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {taskLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground italic">
                    No task execution history found in this database.
                  </td>
                </tr>
              ) : (
                taskLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      {formatTaskName(log.taskName)}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {format(new Date(log.startedAt), "MMM dd, HH:mm")}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatDuration(log.startedAt, log.completedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {log.status === "FAILED" ? (
                        <span className="text-destructive font-mono text-[10px] line-clamp-1">
                          {log.errorMessage || "Unknown Scraper Exception"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {formatMetadata(log.taskName, log.metadata)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
