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

  const tabs = [
    { id: "health", label: "System Health & Tasks", icon: PresentationBarChart02FreeIcons },
    { id: "sources", label: "Source Control Center", icon: Newspaper },
    { id: "ai", label: "AI Engine Settings", icon: Sparkles },
    { id: "users", label: "User Administration", icon: UserSettings01Icon },
    { id: "skipped", label: "Caching & Skipped Backlog", icon: Bookmark02Icon },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <HugeiconsIcon icon={UserSettings01Icon} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            System health, news feeds control, AI models settings, and user permissions.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Vertical Tabs Navigation */}
        <nav className="w-full md:w-64 shrink-0 bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm space-y-2 md:sticky md:top-24">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2 block">
            Navigation
          </span>
          <div className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`?tab=${tab.id}`}
                  scroll={false}
                  className={`flex items-center gap-3 text-sm text-left px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:translate-x-1"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} className="w-4.5 h-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Dynamic Tab Content Area */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === "health" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight">System Health & Task Observability</h2>
              <p className="text-muted-foreground text-sm">
                View background worker health, cron task logs, heartbeats, and database telemetry.
              </p>
              <div className="h-64 border border-dashed rounded-xl border-border bg-muted/10 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                Task Telemetry and Errors Panel (Phase 3)
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Source Control Center</h2>
              <p className="text-muted-foreground text-sm">
                Manage geopolitical RSS feed sources, toggle states, inspect crawler failures, and manually trigger ingestion.
              </p>
              <div className="h-64 border border-dashed rounded-xl border-border bg-muted/10 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                Feeds Manager Table and Actions (Phase 4)
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight">AI Engine Settings</h2>
              <p className="text-muted-foreground text-sm">
                Override active AI models, adjust parameters, set rate limits, and view cost/token utilization telemetry.
              </p>
              <div className="h-64 border border-dashed rounded-xl border-border bg-muted/10 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                Model Settings Forms and Cost Charts (Phase 5)
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight">User Administration</h2>
              <p className="text-muted-foreground text-sm">
                View users list, manage roles (promotions/demotions), and suspend or unsuspend user accounts.
              </p>
              <div className="h-64 border border-dashed rounded-xl border-border bg-muted/10 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                Users Grid and Access Controls (Phase 6)
              </div>
            </div>
          )}

          {activeTab === "skipped" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Caching & Skipped Backlog</h2>
              <p className="text-muted-foreground text-sm">
                Audit skipped backlog articles, view failed enrichments, query caching tags, and access the Gazetteer sandbox.
              </p>
              <div className="h-64 border border-dashed rounded-xl border-border bg-muted/10 animate-pulse flex items-center justify-center text-sm text-muted-foreground">
                Skipped Diagnostics and Gazetteer Sandbox (Phase 7)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
