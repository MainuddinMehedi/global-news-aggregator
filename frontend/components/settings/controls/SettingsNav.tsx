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

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    // Initial check
    handleScroll();

    return () =>
      window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);

    if (el) {
      const scrollContainer = el.closest(".overflow-y-auto") || window;

      if (scrollContainer === window) {
        const y = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        const container = scrollContainer as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollTop =
          container.scrollTop + (elRect.top - containerRect.top) - 32;
        container.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    }
  };

  return (
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
  );
}
