"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings, type Theme } from "@/store";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AppearanceSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { setSetting } = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Appearance</Label>
          <p className="text-sm text-muted-foreground">
            Light, dark, or system mode.
          </p>
        </div>
        <div className="w-[180px] h-10 bg-muted/20 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label>Appearance</Label>
        <p className="text-sm text-muted-foreground">
          Light, dark, or system mode.
        </p>
      </div>
      <Select
        value={theme}
        onValueChange={(val: Theme) => {
          setTheme(val);
          setSetting("theme", val);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select appearance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light Mode</SelectItem>
          <SelectItem value="dark">Dark Mode</SelectItem>
          <SelectItem value="system">System Default</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
