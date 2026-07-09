"use client";

import ProfileSection from "@/components/settings/sections/ProfileSection";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColorTheme, AllSettings, Theme } from "@/store";
import { Check } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "maia", label: "Maia", swatch: "bg-[oklch(0.55_0.15_200)]" },
  { id: "ember", label: "Ember", swatch: "bg-[oklch(0.65_0.18_40)]" },
  { id: "iris", label: "Iris", swatch: "bg-[oklch(0.55_0.22_290)]" },
  { id: "pine", label: "Pine", swatch: "bg-[oklch(0.45_0.14_160)]" },
  { id: "slate", label: "Slate", swatch: "bg-[oklch(0.218_0.008_223.9)]" },
];

interface GeneralSectionProps {
  settings: {
    colorTheme: ColorTheme;
  };
  onSettingChange: <K extends keyof AllSettings>(
    key: K,
    value: AllSettings[K],
  ) => void;
}

export default function GeneralSection({
  settings,
  onSettingChange,
}: GeneralSectionProps) {
  const { theme, setTheme } = useTheme();
  const { colorTheme } = settings;

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Basic interface and profile preferences.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <ProfileSection />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Appearance</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <Select
              value={theme}
              onValueChange={(v: Theme) => {
                setTheme(v);
                onSettingChange("theme", v);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Color Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose the accent color palette for the interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {COLOR_THEMES.map(({ id, label, swatch }) => (
                <button
                  key={id}
                  onClick={() => onSettingChange("colorTheme", id)}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      colorTheme === id
                        ? "border-foreground shadow-md"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute inset-1 rounded-full ${swatch}`}
                    />
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
        </CardContent>
      </Card>
    </>
  );
}
