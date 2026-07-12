import { getNotificationPreferenceAction } from "@/app/actions/notifications";
import { auth } from "@/auth";
import NotificationForm from "@/components/settings/controls/NotificationForm";
import { NotificationsSectionSkeleton } from "@/components/skeletons/settings/NotificationsSectionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { SignInPromptCard } from "@/components/ui/SignInPromptCard";
import { Bell } from "@hugeicons/core-free-icons";
import { Suspense } from "react";

export default function NotificationsSection() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Notification Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure where and how you receive updates for your Locked Topics and
          story events.
        </p>
      </div>

      <Card>
        <Suspense fallback={<NotificationsSectionSkeleton />}>
          <NotificationsSectionContent />
        </Suspense>
      </Card>
    </>
  );
}

async function NotificationsSectionContent() {
  const session = await auth();

  if (!session?.user) {
    return (
      <CardContent className="p-6">
        <SignInPromptCard
          icon={Bell}
          title="Sign in for Notifications"
          description="Configure webhook integrations (Discord, Telegram) and periodic summaries for your monitored topics."
        />
      </CardContent>
    );
  }

  const pref = await getNotificationPreferenceAction();

  return (
    <CardContent className="p-6 space-y-6">
      <NotificationForm key={JSON.stringify(pref)} initialPreferences={pref} />
    </CardContent>
  );
}
