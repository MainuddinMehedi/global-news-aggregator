"use client";

import { Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <HugeiconsIcon icon={Sun} className="w-5 h-5 text-foreground" />
      ) : (
        <HugeiconsIcon icon={Moon} className="w-5 h-5 text-foreground" />
      )}
    </button>
  );
}
