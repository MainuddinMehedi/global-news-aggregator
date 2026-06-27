import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserNotifications } from "@/queries/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";
import { NotificationsPageSkeleton } from "@/components/notifications/NotificationsPageSkeleton";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            System health updates, pipeline diagnostics, personal topic alerts, and stories.
          </p>
        </div>
      </div>

      <Suspense fallback={<NotificationsPageSkeleton />}>
        <NotificationsLoader userId={session.user.id} />
      </Suspense>
    </div>
  );
}

async function NotificationsLoader({ userId }: { userId: string }) {
  const initialData = await getUserNotifications(userId, {
    page: 1,
    limit: 20,
  });

  return (
    <NotificationList
      initialNotifications={initialData.notifications}
      initialTotal={initialData.total}
      initialHasMore={initialData.hasMore}
    />
  );
}
