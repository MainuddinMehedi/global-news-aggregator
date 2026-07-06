"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BUILTIN_SOURCES } from "@/lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { getUserSettings, saveUserSettingsAction } from "@/app/actions/settings";
import { CheckListIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export default function OnboardingModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  // Open the modal if the user is authenticated and hasn't onboarded yet
  useEffect(() => {
    if (status === "authenticated") {
      getUserSettings().then(({ settings }) => {
        setCurrentSettings(settings);
        if (!settings.hasOnboardedSources) {
          setIsOpen(true);
        }
      }).catch(err => console.error("Failed to fetch settings for onboarding:", err));
    }
  }, [status]);

  const handleChoice = (useDefaults: boolean) => {
    if (!currentSettings) return;

    const newSettings = { ...currentSettings, hasOnboardedSources: true };
    if (useDefaults) {
      toast.success("Global news sources active in your pipeline.");
    } else {
      const allBuiltinUrls = BUILTIN_SOURCES.map((s) => s.url);
      newSettings.disabledBuiltinSources = allBuiltinUrls;
      toast.success("Ready for you to add your own sources.");
    }

    // Sync onboarding settings to the database immediately
    saveUserSettingsAction(newSettings)
      .catch((err) => console.error("Failed to sync onboarding settings:", err));

    setIsOpen(false);
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Remove the close button entirely if we want to force them to choose, 
          but usually it's fine to let them click outside which acts as 'skip',
          however if they skip, `hasOnboardedSources` stays false so it'll pop up again.
          Let's force a choice by omitting the close button or preventing close on interact outside.
      */}
      <DialogContent 
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Global News!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Before we build your feed, how would you like to set up your news sources?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 justify-start text-left flex gap-4 hover:bg-muted/50"
            onClick={() => handleChoice(true)}
          >
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <HugeiconsIcon icon={CheckListIcon} className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-lg">Use Default Sources</div>
              <div className="text-sm text-muted-foreground whitespace-normal">
                Start with a curated list of global news sources (Al Jazeera, UN News, TechCrunch, etc.).
              </div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto p-4 justify-start text-left flex gap-4 hover:bg-muted/50"
            onClick={() => handleChoice(false)}
          >
            <div className="bg-primary/10 p-2 rounded-full shrink-0">
              <HugeiconsIcon icon={Settings02Icon} className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-lg">Start Fresh</div>
              <div className="text-sm text-muted-foreground whitespace-normal">
                Don't add any sources yet. I will manually add my own specific RSS feeds.
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
