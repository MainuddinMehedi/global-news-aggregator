import SettingsNav from "@/components/settings/controls/SettingsNav";
import AdvancedSettingsWrapper from "@/components/settings/sections/AdvancedSettingsWrapper";
import FeedSection from "@/components/settings/sections/FeedSection";
import GeneralSection from "@/components/settings/sections/GeneralSection";
import NotificationsSection from "@/components/settings/sections/NotificationsSection";
import { Suspense } from "react";

export default function SettingsInterface() {
  return (
    <div className="flex flex-col md:flex-row gap-10 items-start">
      {/* Documentation-style Navigation / Table of Contents */}
      <SettingsNav />

      {/* Main Content Area */}
      <div className="flex-1 space-y-16 pb-24 w-full max-w-2xl">
        {/* General Settings */}
        <section id="general" className="scroll-mt-32 space-y-6">
          <GeneralSection />
        </section>

        {/* Feed Settings */}
        <section id="feed" className="scroll-mt-32 space-y-6">
          <FeedSection />
        </section>

        {/* Notifications Settings */}
        <section id="notifications" className="scroll-mt-32 space-y-6">
          <NotificationsSection />
        </section>

        {/* Advanced Settings */}
        <section id="advanced" className="scroll-mt-32 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Advanced</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage categories, custom RSS sources, and account deletion.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-40 bg-muted/20 animate-pulse rounded-xl" />
            }
          >
            <AdvancedSettingsWrapper />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
