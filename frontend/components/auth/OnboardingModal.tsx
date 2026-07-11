"use client";

import { saveUserSettingsAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Analytics01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

export default function OnboardingModal({
  defaultOpen,
  currentSettings,
}: {
  defaultOpen: boolean;
  currentSettings: any;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [slide, setSlide] = useState(0);

  const handleComplete = () => {
    if (!currentSettings) return;

    // TODO: In the future, we will add a step to collect Topic Preferences here
    // before saving and completing onboarding.
    const newSettings = { ...currentSettings, hasOnboardedSources: true };

    // Sync onboarding settings to the database immediately
    saveUserSettingsAction(newSettings).catch((err) =>
      console.error("Failed to sync onboarding settings:", err),
    );

    toast.success("Welcome to Global News!");
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleComplete();
    } else {
      setIsOpen(true);
    }
  };

  const slides = [
    {
      title: "Global Perspective",
      description:
        "We ingest and deduplicate news from a curated list of trusted global sources so you see the whole picture without the noise.",
      icon: Globe02Icon,
    },
    {
      title: "AI Intelligence",
      description:
        "Our ML models instantly analyze every article for political bias, sentiment, and semantic themes, grouping them into actionable clusters.",
      icon: Analytics01Icon,
    },
    {
      title: "Surveillance Mode",
      description:
        "Want to track a specific subject, add a custom RSS feed, or receive digests? Use the advanced Locked Topics feature to put our AI on surveillance duty.",
      icon: Search01Icon,
    },
  ];

  const currentSlide = slides[slide];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
        <div className="flex flex-col h-[400px]">
          {/* Top visual area */}
          <div className="flex-1 bg-muted/30 relative flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            {/* Background decorative blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-background rounded-2xl shadow-sm border border-border/50 flex items-center justify-center">
                <HugeiconsIcon
                  icon={currentSlide.icon}
                  className="w-10 h-10 text-primary"
                />
              </div>
              <div className="space-y-2 max-w-[280px]">
                <h2 className="text-2xl font-bold tracking-tight">
                  {currentSlide.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentSlide.description}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom action area */}
          <div className="p-6 bg-background border-t border-border/50 flex items-center justify-between shrink-0">
            {/* Slide indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i === slide ? "w-4 bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {slide > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setSlide((s) => s - 1)}
                  className="text-muted-foreground"
                >
                  Back
                </Button>
              )}
              {slide < slides.length - 1 ? (
                <Button
                  onClick={() => setSlide((s) => s + 1)}
                  className="min-w-[100px] flex items-center gap-2"
                >
                  Next
                  <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="min-w-[120px] flex items-center gap-2"
                >
                  Get Started
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="w-4 h-4"
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
