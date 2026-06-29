"use client";

import { useEffect, useState } from "react";
import { useSettings, type SettingsState, type CustomSource } from "@/store";
import { toast } from "sonner";
import { updateSingleSettingAction } from "@/app/actions/settings";
import { useSession } from "next-auth/react";
import { SignInPromptCard } from "@/components/ui/SignInPromptCard";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import NotificationsSection from "@/components/settings/sections/NotificationsSection";
import SourcesSection from "@/components/settings/sections/SourcesSection";
import GeneralSection from "@/components/settings/sections/GeneralSection";
import FeedSection from "@/components/settings/sections/FeedSection";
// import AiSection from "@/components/settings/sections/AiSection";
import AdvancedCategoriesSection from "@/components/settings/sections/AdvancedCategoriesSection";
import DangerZoneSection from "@/components/settings/sections/DangerZoneSection";

const SETTINGS_SECTIONS = [
  { id: "general", label: "General" },
  { id: "feed", label: "Feed Preferences" },
  // { id: "ai", label: "AI & Analysis" },
  { id: "notifications", label: "Notifications" },
  { id: "advanced", label: "Advanced" },
];

export default function SettingsInterface({ 
  dbCustomSources = [], 
  dbDisabledBuiltinSources = [] 
}: { 
  dbCustomSources?: CustomSource[], 
  dbDisabledBuiltinSources?: string[] 
}) {
  const [mounted, setMounted] = useState(false);
  const { settings, setSetting } = useSettings();
  const [activeSection, setActiveSection] = useState<string>("general");
  const { status } = useSession();

  const handleSettingChange = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    setSetting(key, value);
    // Persist to DB immediately if authenticated
    if (status === "authenticated") {
      updateSingleSettingAction(key, value).catch(err => {
        console.error(`Failed to sync setting ${key}:`, err);
        toast.error("Failed to save setting");
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const handleScroll = () => {
      let currentSection = SETTINGS_SECTIONS[0].id;
      for (const section of SETTINGS_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 300) {
            currentSection = section.id;
          } else {
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col md:flex-row gap-10 animate-pulse">
        <div className="w-full md:w-56 shrink-0 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-full bg-muted rounded-md"
            />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          <div className="h-64 w-full bg-muted rounded-xl" />
          <div className="h-64 w-full bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const scrollContainer = el.closest('.overflow-y-auto') || window;
      if (scrollContainer === window) {
        const y = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        const container = scrollContainer as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollTop = container.scrollTop + (elRect.top - containerRect.top) - 32;
        container.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10 items-start">
      {/* Documentation-style Navigation / Table of Contents */}
      <nav className="w-full md:w-56 shrink-0 md:sticky md:top-24">
        <div className="flex flex-col space-y-1">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`text-sm text-left px-3 py-2 rounded-md transition-all duration-200 ${
                activeSection === section.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 space-y-16 pb-24 w-full max-w-2xl">
        {/* General Settings */}
        <section id="general" className="scroll-mt-32 space-y-6">
          <GeneralSection settings={settings} onSettingChange={handleSettingChange} />
        </section>

        {/* Feed Settings */}
        <section id="feed" className="scroll-mt-32 space-y-6">
          <FeedSection settings={settings} onSettingChange={handleSettingChange} />
        </section>

        {/* AI & Chat Settings */}
        {/*
        <section id="ai" className="scroll-mt-32 space-y-6">
          <AiSection settings={settings} onSettingChange={handleSettingChange} />
        </section>
        */}

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
          
          {status === "authenticated" ? (
            <div className="space-y-6">
              <AdvancedCategoriesSection settings={settings} onSettingChange={handleSettingChange} />
              <SourcesSection 
                dbCustomSources={dbCustomSources} 
                dbDisabledBuiltinSources={dbDisabledBuiltinSources} 
              />
              <DangerZoneSection />
            </div>
          ) : (
            <SignInPromptCard
              icon={Settings02Icon}
              title="Sign in to access Advanced Settings"
              description="Manage category favorites, custom RSS sources, and your account settings."
            />
          )}
        </section>
      </div>
    </div>
  );
}
