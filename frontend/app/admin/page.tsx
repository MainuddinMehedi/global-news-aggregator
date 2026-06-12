import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserSettings01Icon } from "@hugeicons/core-free-icons";

export default async function AdminDashboard() {
  const session = await auth();

  // Middleware should catch this, but double check on the server
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <HugeiconsIcon icon={UserSettings01Icon} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System telemetry, user management, and platform controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future admin features */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">System Status</h3>
          <p className="text-sm text-muted-foreground">All systems operational.</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">User Management</h3>
          <p className="text-sm text-muted-foreground">Manage roles and permissions.</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-2">Telemetry</h3>
          <p className="text-sm text-muted-foreground">View AI usage and pipeline metrics.</p>
        </div>
      </div>
    </div>
  );
}
