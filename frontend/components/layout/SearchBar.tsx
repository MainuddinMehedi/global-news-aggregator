"use client";

import { useEffect, useRef, useState } from "react";
import { Cancel01Icon, Search } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const search = searchParams.get("search") ?? "";
  const [value, setValue] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search"); // Keep URL clean when empty
      }

      // replace (not push) - avoid filling history with every keystroke
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 400);
  };

  // Auto-focus input when mobile search opens
  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const hiddenPaths = ["/system-supar-admin", "/settings", "/analytics"];
  const shouldHide = pathname ? hiddenPaths.some((path) => pathname.startsWith(path)) : false;
  if (shouldHide) return null;

  return (
    <>
      {/* ── Mobile full-width overlay (covers the entire navbar) ── */}
      {mobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-0 h-16 z-30 bg-background/98 backdrop-blur-md flex items-center px-4 gap-3 border-b border-border">
          <HugeiconsIcon
            icon={Search}
            className="w-4 h-4 text-muted-foreground shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles, entities..."
            value={value}
            onChange={handleChange}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground text-foreground"
          />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close search"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Mobile: search icon button (hidden on md+) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Search"
        className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <HugeiconsIcon icon={Search} className="w-5 h-5" />
      </button>

      {/* ── Desktop: always-visible search input (hidden below md) ── */}
      <div className="relative w-full max-w-md hidden md:block">
        <HugeiconsIcon
          icon={Search}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search articles, entities..."
          value={value}
          onChange={handleChange}
          className="w-full bg-muted/50 border border-input rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all placeholder:text-muted-foreground"
        />
      </div>
    </>
  );
}
