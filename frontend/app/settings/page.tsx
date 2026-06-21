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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
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
  
  let customSources = [];
  let disabledBuiltinSources = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { settings: true },
    });
    
    if (user?.settings) {
      const settings = user.settings as any;
      customSources = settings.customSources || [];
      disabledBuiltinSources = settings.disabledBuiltinSources || [];
    }
  }

  return (
    <SettingsInterface 
      dbCustomSources={customSources} 
      dbDisabledBuiltinSources={disabledBuiltinSources} 
    />
  );
}
