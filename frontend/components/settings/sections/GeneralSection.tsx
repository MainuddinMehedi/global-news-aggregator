import AppearanceSelector from "@/components/settings/controls/AppearanceSelector";
import ColorThemeSelector from "@/components/settings/controls/ColorThemeSelector";
import ProfileSection from "@/components/settings/sections/ProfileSection";
import { GeneralSectionSkeleton } from "@/components/skeletons/settings/GeneralSectionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";

export default function GeneralSection() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Basic interface and profile preferences.
        </p>
      </div>

      <Card>
        <Suspense fallback={<GeneralSectionSkeleton />}>
          <CardContent className="p-6 space-y-6">
            <ProfileSection />

            {/* Theme and accent */}
            <AppearanceSelector />
            <ColorThemeSelector />
          </CardContent>
        </Suspense>
      </Card>
    </>
  );
}
