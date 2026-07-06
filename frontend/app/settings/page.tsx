import { Metadata } from "next";
import { Suspense } from "react";
import SettingsInterface from "@/components/settings/SettingsInterface";
import SettingsSkeleton from "@/components/settings/SettingsSkeleton";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Settings | Global News Aggregator",
  description: "Manage your preferences and app settings",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your news feed, AI preferences, and display settings.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}

async function SettingsLoader() {
  const session = await auth();
  
  let settingsObj = {};

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { settings: true },
    });
    
    if (user?.settings) {
      settingsObj = user.settings;
    }
  }

  return (
    <SettingsInterface dbSettings={settingsObj} />
  );
}
