import {
  getRunningTasks,
  getTaskLogs,
  getSystemHealthOverview,
  getIngestionVolumeChartData,
} from "@/queries/admin/health";
import SystemHealthTab from "../SystemHealthTab";

export default async function SystemHealthTabWrapper() {
  const [runningTasks, taskLogs, healthOverview, chartData] = await Promise.all([
    getRunningTasks(),
    getTaskLogs(50),
    getSystemHealthOverview(),
    getIngestionVolumeChartData(7),
  ]);

  return (
    <SystemHealthTab
      runningTasks={runningTasks}
      taskLogs={taskLogs}
      healthOverview={healthOverview}
      chartData={chartData}
    />
  );
}
