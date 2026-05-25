"use client";

import { useEffect, useState } from "react";
import { useSettings, type ResponseStyle, type ColorTheme } from "@/store";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES } from "@/lib/constants";
import { Check } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "maia", label: "Maia", swatch: "bg-[oklch(0.55_0.15_200)]" },
  { id: "ember", label: "Ember", swatch: "bg-[oklch(0.65_0.18_40)]" },
  { id: "iris", label: "Iris", swatch: "bg-[oklch(0.55_0.22_290)]" },
  { id: "pine", label: "Pine", swatch: "bg-[oklch(0.45_0.14_160)]" },
  { id: "slate", label: "Slate", swatch: "bg-[oklch(0.218_0.008_223.9)]" },
];

const SETTINGS_SECTIONS = [
  { id: "general", label: "General" },
  { id: "feed", label: "Feed Preferences" },
  { id: "ai", label: "AI & Analysis" },
  { id: "categories", label: "Categories" },
];

export default function SettingsInterface() {
  const [mounted, setMounted] = useState(false);
  const { settings, setSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const { colorTheme } = settings;
  const [activeSection, setActiveSection] = useState<string>("general");

  useEffect(() => {
    setMounted(true);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    SETTINGS_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-56 shrink-0 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-full bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
          <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Adjusted offset to account for sticky headers if any, or general padding
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight">General</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic interface and display preferences.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Appearance</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
                <Select value={theme} onValueChange={(v) => setTheme(v)}>
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

              <Separator />

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
                      onClick={() => setSetting("colorTheme", id)}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        colorTheme === id
                          ? "border-foreground shadow-md"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}>
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

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce whitespace in article cards for a denser view.
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) =>
                    setSetting("compactMode", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Feed Settings */}
        <section id="feed" className="scroll-mt-32 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Feed Preferences
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Control how news articles are displayed and sorted.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Default Category</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which category loads by default.
                  </p>
                </div>
                <Select
                  value={settings.feedDefaultCategory}
                  onValueChange={(v) => setSetting("feedDefaultCategory", v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All News</SelectItem>
                    {CANONICAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Default Sort</Label>
                  <p className="text-sm text-muted-foreground">
                    Preferred order for news articles.
                  </p>
                </div>
                <Select
                  value={settings.feedDefaultSort}
                  onValueChange={(v) => setSetting("feedDefaultSort", v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="impact">Highest Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Articles Per Page</Label>
                  <p className="text-sm text-muted-foreground">
                    Number of articles to load at once.
                  </p>
                </div>
                <Select
                  value={settings.articlesPerPage.toString()}
                  onValueChange={(v) =>
                    setSetting("articlesPerPage", parseInt(v))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* AI & Chat Settings */}
        <section id="ai" className="scroll-mt-32 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI & Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure the AI assistant and analysis transparency.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Default AI Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which model powers your chat sessions.
                  </p>
                </div>
                <Select
                  value={settings.defaultAiModel}
                  onValueChange={(v) => setSetting("defaultAiModel", v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groq-llama-3">
                      Groq (Llama 3 - Fast)
                    </SelectItem>
                    <SelectItem value="google-gemini-1.5-pro">
                      Google (Gemini 1.5 Pro - Quality)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Response Style</Label>
                  <p className="text-sm text-muted-foreground">
                    Preferred format for AI summaries and chat.
                  </p>
                </div>
                <Select
                  value={settings.responseStyle}
                  onValueChange={(v: ResponseStyle) =>
                    setSetting("responseStyle", v)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise (Bullets)</SelectItem>
                    <SelectItem value="detailed">
                      Detailed (Paragraphs)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Bias Transparency</Label>
                  <p className="text-sm text-muted-foreground">
                    Show perspective and bias badges on news articles.
                  </p>
                </div>
                <Switch
                  checked={settings.showBiasBadges}
                  onCheckedChange={(checked) =>
                    setSetting("showBiasBadges", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sentiment Analysis</Label>
                  <p className="text-sm text-muted-foreground">
                    Display detected sentiment on article previews.
                  </p>
                </div>
                <Switch
                  checked={settings.showSentiment}
                  onCheckedChange={(checked) =>
                    setSetting("showSentiment", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Categories Settings */}
        <section id="categories" className="scroll-mt-32 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize your feed by favoring or hiding specific topics.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <Label>Favorite Categories</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CANONICAL_CATEGORIES.map((cat) => (
                    <div
                      key={`fav-${cat}`}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`fav-${cat}`}
                        checked={settings.favoriteCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...settings.favoriteCategories, cat]
                            : settings.favoriteCategories.filter(
                                (c) => c !== cat,
                              );
                          setSetting("favoriteCategories", next);
                        }}
                      />
                      <label
                        htmlFor={`fav-${cat}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Hidden Categories</Label>
                  <p className="text-sm text-muted-foreground">
                    Articles from these categories will be removed from your
                    main feed.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CANONICAL_CATEGORIES.map((cat) => (
                    <div
                      key={`hide-${cat}`}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`hide-${cat}`}
                        checked={settings.hiddenCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...settings.hiddenCategories, cat]
                            : settings.hiddenCategories.filter(
                                (c) => c !== cat,
                              );
                          setSetting("hiddenCategories", next);
                        }}
                      />
                      <label
                        htmlFor={`hide-${cat}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
