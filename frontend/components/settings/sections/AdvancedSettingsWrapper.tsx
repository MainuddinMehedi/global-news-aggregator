import { auth } from "@/auth";
import AdvancedCategoriesSection from "@/components/settings/sections/AdvancedCategoriesSection";
import DangerZoneSection from "@/components/settings/sections/DangerZoneSection";
import SourcesSection from "@/components/settings/sections/SourcesSection";
import { SignInPromptCard } from "@/components/ui/SignInPromptCard";
import { getCachedFeedSources } from "@/queries/feedSources";
import { getCachedUserSettings } from "@/queries/userSettings";
import { Settings02Icon } from "@hugeicons/core-free-icons";

export default async function AdvancedSettingsWrapper() {
  const session = await auth();

  if (!session?.user) {
    return (
      <SignInPromptCard
        icon={Settings02Icon}
        title="Sign in to access Advanced Settings"
        description="Manage category favorites, custom RSS sources, and your account settings."
      />
    );
  }

  const [dbSettings, dbFeedSources] = await Promise.all([
    getCachedUserSettings(),
    getCachedFeedSources(),
  ]);

  return (
    <div className="space-y-6">
      <AdvancedCategoriesSection dbSettings={dbSettings} />
      <SourcesSection dbSettings={dbSettings} dbFeedSources={dbFeedSources} />
      <DangerZoneSection />
    </div>
  );
}
