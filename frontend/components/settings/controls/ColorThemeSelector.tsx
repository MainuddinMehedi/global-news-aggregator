"use client";

import { Label } from "@/components/ui/label";
import { useSettings, type ColorTheme } from "@/store";
import { Check } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "maia", label: "Maia", swatch: "bg-[oklch(0.55_0.15_200)]" },
  { id: "ember", label: "Ember", swatch: "bg-[oklch(0.65_0.18_40)]" },
  { id: "iris", label: "Iris", swatch: "bg-[oklch(0.55_0.22_290)]" },
  { id: "pine", label: "Pine", swatch: "bg-[oklch(0.45_0.14_160)]" },
  { id: "slate", label: "Slate", swatch: "bg-[oklch(0.218_0.008_223.9)]" },
];

export default function ColorThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { settings, setSetting } = useSettings();
  const colorTheme = settings.colorTheme;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Color Theme</Label>
          <p className="text-sm text-muted-foreground">
            Choose a color palette for the interface.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Color Theme</Label>
        <p className="text-sm text-muted-foreground">
          Choose a color palette for the interface.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {COLOR_THEMES.map(({ id, label, swatch }) => (
          <button
            key={id}
            onClick={() => setSetting("colorTheme", id)}
            className="group flex flex-col items-center gap-1.5"
          >
            <div
              className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                colorTheme === id
                  ? "border-foreground shadow-md"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <div className={`absolute inset-1 rounded-full ${swatch}`} />
              {colorTheme === id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <HugeiconsIcon
                    icon={Check}
                    className="w-4 h-4 text-white drop-shadow"
                  />
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
