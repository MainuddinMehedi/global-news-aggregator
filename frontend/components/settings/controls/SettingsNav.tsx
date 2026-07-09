"use client";

import { useEffect, useState } from "react";

const SETTINGS_SECTIONS = [
  { id: "general", label: "General" },
  { id: "feed", label: "Feed Preferences" },
  { id: "notifications", label: "Notifications" },
  { id: "advanced", label: "Advanced" },
];

export default function SettingsNav() {
  const [activeSection, setActiveSection] = useState<string>(
    SETTINGS_SECTIONS[0]?.id || "",
  );

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = SETTINGS_SECTIONS[0].id;
      let minDistance = Infinity;

      SETTINGS_SECTIONS.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - 100);

          if (distance < minDistance && rect.top < window.innerHeight / 2) {
            minDistance = distance;
            currentSection = id;
          }
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="w-full md:w-64 shrink-0 md:sticky md:top-24 space-y-1 bg-card/45 border-border/50 shadow-sm p-4 rounded-xl border">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
        Settings
      </h3>
      <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
        {SETTINGS_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`
              text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
              ${
                activeSection === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
