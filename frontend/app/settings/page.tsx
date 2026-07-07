import SettingsInterface from "@/components/settings/SettingsInterface";
import SettingsSkeleton from "@/components/settings/SettingsSkeleton";
import { getCachedUserSettings } from "@/queries/userSettings";
import { Metadata } from "next";
import { Suspense } from "react";

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
  const settingsObj = await getCachedUserSettings();

  return (
    <SettingsInterface
      dbSettings={settingsObj}
      dbCustomSources={settingsObj.customSources || []}
      dbDisabledBuiltinSources={settingsObj.disabledBuiltinSources || []}
    />
  );
}
