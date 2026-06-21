import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PresentationBarChart02FreeIcons,
  Newspaper,
  Sparkles,
  UserSettings01Icon,
  Bookmark02Icon,
} from "@hugeicons/core-free-icons";
import {
  getRunningTasks,
  getTaskLogs,
  getSystemHealthOverview,
  getIngestionVolumeChartData,
} from "@/queries/admin/health";
import { getFeedSources } from "@/queries/admin/sources";
import { getAiConfigSettings, getAiUsageTimeline } from "@/queries/admin/ai";
import { getUsers } from "@/queries/admin/users";
import {
  getSkippedArticles,
  getFailedEnrichments,
  getGazetteerCategoriesAndRegions,
} from "@/queries/admin/skipped";
import SystemHealthTab from "@/components/admin/SystemHealthTab";
import SourceControlTab from "@/components/admin/SourceControlTab";
import AiEngineTab from "@/components/admin/ai/AiEngineTab";
import UserAdminTab from "@/components/admin/UserAdminTab";
import SkippedBacklogTab from "@/components/admin/SkippedBacklogTab";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const params = await searchParams;
  const activeTab = typeof params.tab === "string" ? params.tab : "health";

  let runningTasks: any[] = [];
  let taskLogs: any[] = [];
  let healthOverview: any = {
    activeWorkersCount: 0,
    ingestionRatePerHour: 0,
    dedupEfficiency: 0,
    totalFailures24h: 0,
    recentErrors: [],
  };
  let chartData: any[] = [];
  let feedSources: any[] = [];
  let aiSettings: any = null;
  let usageTimeline: any[] = [];
  let users: any[] = [];
  let searchQuery = "";
  let skippedArticles: any[] = [];
  let failedEnrichments: any[] = [];
  let gazetteerConfig: any = { categories: [], regions: [], rawConfig: {} };

  if (activeTab === "health") {
    [runningTasks, taskLogs, healthOverview, chartData] = await Promise.all([
      getRunningTasks(),
      getTaskLogs(50),
      getSystemHealthOverview(),
      getIngestionVolumeChartData(7),
    ]);
  } else if (activeTab === "sources") {
    feedSources = await getFeedSources();
  } else if (activeTab === "ai") {
    [aiSettings, usageTimeline] = await Promise.all([
      getAiConfigSettings(),
      getAiUsageTimeline(30),
    ]);
  } else if (activeTab === "users") {
    searchQuery = typeof params.q === "string" ? params.q : "";
    users = await getUsers(searchQuery);
  } else if (activeTab === "skipped") {
    [skippedArticles, failedEnrichments, gazetteerConfig] = await Promise.all([
      getSkippedArticles(50),
      getFailedEnrichments(50),
      getGazetteerCategoriesAndRegions(),
    ]);
  }

  const tabs = [
    { id: "health", label: "System Health & Tasks", shortLabel: "Health", icon: PresentationBarChart02FreeIcons },
    { id: "sources", label: "Source Control Center", shortLabel: "Feeds", icon: Newspaper },
    { id: "ai", label: "AI Engine Settings", shortLabel: "AI Config", icon: Sparkles },
    { id: "users", label: "User Administration", shortLabel: "Users", icon: UserSettings01Icon },
    { id: "skipped", label: "Caching & Skipped Backlog", shortLabel: "Backlog", icon: Bookmark02Icon },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
          <HugeiconsIcon icon={UserSettings01Icon} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Admin Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            System health, news feeds control, AI models settings, and user permissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Vertical Tabs Navigation */}
        <nav className="w-full md:w-64 shrink-0 bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 md:p-4 shadow-sm md:sticky md:top-24">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2 hidden md:block">
            Navigation
          </span>
          <div className="flex flex-row md:flex-col justify-between md:justify-start w-full gap-1 md:gap-0 md:space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`?tab=${tab.id}`}
                  scroll={false}
                  title={tab.label}
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-3 text-center md:text-left px-2 py-1.5 md:px-3 md:py-2.5 rounded-xl transition-all duration-300 flex-1 md:flex-none ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 md:hover:translate-x-1"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} className="w-4.5 h-4.5 shrink-0" />
                  <span className="hidden md:block text-sm">{tab.label}</span>
                  <span className="block md:hidden text-[9px] font-bold mt-0.5 tracking-tight leading-none">{tab.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Dynamic Tab Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === "health" && (
            <SystemHealthTab
              runningTasks={runningTasks}
              taskLogs={taskLogs}
              healthOverview={healthOverview}
              chartData={chartData}
            />
          )}

          {activeTab === "sources" && (
            <SourceControlTab feedSources={feedSources} />
          )}

          {activeTab === "ai" && (
            <AiEngineTab initialSettings={aiSettings} usageTimeline={usageTimeline} />
          )}

          {activeTab === "users" && (
            <UserAdminTab users={users} searchQuery={searchQuery} />
          )}

          {activeTab === "skipped" && (
            <SkippedBacklogTab
              skippedArticles={skippedArticles}
              failedEnrichments={failedEnrichments}
              gazetteerConfig={gazetteerConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
