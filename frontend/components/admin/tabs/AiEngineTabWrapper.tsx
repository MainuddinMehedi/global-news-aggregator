import { getAiConfigSettings, getAiUsageTimeline } from "@/queries/admin/ai";
import AiEngineTab from "../ai/AiEngineTab";

export default async function AiEngineTabWrapper() {
  const [aiSettings, usageTimeline] = await Promise.all([
    getAiConfigSettings(),
    getAiUsageTimeline(30),
  ]);

  return <AiEngineTab initialSettings={aiSettings} usageTimeline={usageTimeline} />;
}
