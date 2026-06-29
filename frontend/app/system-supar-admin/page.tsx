import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PresentationBarChart02FreeIcons,
  Newspaper,
  Sparkles,
  UserSettings01Icon,
  Bookmark02Icon,
  Bell,
} from "@hugeicons/core-free-icons";

// Wrapper Components
import SystemHealthTabWrapper from "@/components/admin/tabs/SystemHealthTabWrapper";
import SourceControlTabWrapper from "@/components/admin/tabs/SourceControlTabWrapper";
import AiEngineTabWrapper from "@/components/admin/tabs/AiEngineTabWrapper";
import UserAdminTabWrapper from "@/components/admin/tabs/UserAdminTabWrapper";
import SkippedBacklogTabWrapper from "@/components/admin/tabs/SkippedBacklogTabWrapper";
import NotificationConfigTabWrapper from "@/components/admin/tabs/NotificationConfigTabWrapper";
import { Skeleton } from "@/components/ui/skeleton";

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
  const searchQuery = typeof params.q === "string" ? params.q : "";

  const tabs = [
    { id: "health", label: "System Health & Tasks", shortLabel: "Health", icon: PresentationBarChart02FreeIcons },
    { id: "sources", label: "Source Control Center", shortLabel: "Feeds", icon: Newspaper },
    { id: "ai", label: "AI Engine Settings", shortLabel: "AI Config", icon: Sparkles },
    { id: "notifications", label: "Notification Channels", shortLabel: "Alerts", icon: Bell },
    { id: "users", label: "User Administration", shortLabel: "Users", icon: UserSettings01Icon },
    { id: "skipped", label: "Caching & Skipped Backlog", shortLabel: "Backlog", icon: Bookmark02Icon },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
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
          <Suspense fallback={<AdminTabLoading />}>
            {activeTab === "health" && <SystemHealthTabWrapper />}
            {activeTab === "sources" && <SourceControlTabWrapper />}
            {activeTab === "ai" && <AiEngineTabWrapper />}
            {activeTab === "users" && <UserAdminTabWrapper searchQuery={searchQuery} />}
            {activeTab === "skipped" && <SkippedBacklogTabWrapper />}
            {activeTab === "notifications" && <NotificationConfigTabWrapper />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function AdminTabLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-2xl animate-pulse" />
      <Skeleton className="h-64 w-full rounded-2xl animate-pulse" />
    </div>
  );
}
