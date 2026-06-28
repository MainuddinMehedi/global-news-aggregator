import type { SystemTaskData, SystemHealthOverview } from "@/queries/admin/health";
import WorkerOverviewCards from "./health/WorkerOverviewCards";
import ActiveWorkersMonitor from "./health/ActiveWorkersMonitor";
import PipelineVolumeChart from "./health/PipelineVolumeChart";
import CollatedErrorsConsole from "./health/CollatedErrorsConsole";
import WorkerExecutionLogTable from "./health/WorkerExecutionLogTable";
import { TelemetryRefreshButton } from "./health/TelemetryRefreshButton";

interface SystemHealthTabProps {
  runningTasks: SystemTaskData[];
  taskLogs: SystemTaskData[];
  healthOverview: SystemHealthOverview;
  chartData: any[];
}

export default function SystemHealthTab({
  runningTasks,
  taskLogs,
  healthOverview,
  chartData,
}: SystemHealthTabProps) {
  return (
    <div className="space-y-8">
      {/* 4 Stats metrics cards */}
      <WorkerOverviewCards healthOverview={healthOverview} />

      {/* Control Strip & Active Workers */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold tracking-tight text-foreground font-semibold">
              Active Telemetry Monitor
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Live heartbeat status of automated crawlers and workers.
            </p>
          </div>
          <TelemetryRefreshButton />
        </div>

        {/* Live Active Workers lists */}
        <ActiveWorkersMonitor runningTasks={runningTasks} />
      </div>

      {/* Ingestion & Clustering LineChart */}
      <PipelineVolumeChart chartData={chartData} />

      {/* Terminal log console for failures */}
      <CollatedErrorsConsole recentErrors={healthOverview.recentErrors} />

      {/* Run history log audit trail */}
      <WorkerExecutionLogTable taskLogs={taskLogs} />
    </div>
  );
}
