"use client";

import { Label } from "@/components/ui/label";
import { useSettings, type ColorTheme } from "@/store";
import { Check } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "maia", label: "Maia", swatch: "bg-blue-500" },
  { id: "pine", label: "Pine", swatch: "bg-emerald-500" },
  { id: "ember", label: "Ember", swatch: "bg-orange-500" },
  { id: "iris", label: "Iris", swatch: "bg-indigo-500" },
  { id: "slate", label: "Slate", swatch: "bg-slate-500" },
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
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>Color Theme</Label>
          <p className="text-sm text-muted-foreground">
            Choose an accent color for the app.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-9 bg-muted/20 animate-pulse rounded-md border"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Color Theme</Label>
        <p className="text-sm text-muted-foreground">
          Choose an accent color for the app.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {COLOR_THEMES.map((theme) => {
          const isActive = colorTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setSetting("colorTheme", theme.id)}
              className={`
                flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-all
                ${
                  isActive
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:bg-muted"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${theme.swatch}`} />
                <span>{theme.label}</span>
              </div>
              {isActive && (
                <HugeiconsIcon
                  icon={Check}
                  size={14}
                  className="text-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
