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
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES } from "@/lib/constants";
import { Check } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import NotificationsSection from "./NotificationsSection";
import SourcesSection from "./SourcesSection";
import type { HomePageMode } from "@/store";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MODEL_REGISTRY } from "@/lib/ai/modelRegistry";

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
  { id: "notifications", label: "Notifications" },
  { id: "advanced", label: "Advanced" },
];

const ALLOWED_AI_MODELS = ["groq/compound", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"];

export default function SettingsInterface() {
  const [mounted, setMounted] = useState(false);
  const { settings, setSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const { colorTheme } = settings;
  const [activeSection, setActiveSection] = useState<string>("general");
  const { data: session } = useSession();

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Sync settings to server after a debounce
    const timeout = setTimeout(() => {
      fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).catch(err => console.error("Failed to sync settings:", err));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [settings]);

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
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    const displayValue = name || email || "?";
    return displayValue.charAt(0).toUpperCase();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete account");
      
      toast.success("Account deleted successfully. Logging out...");
      signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account.");
      setIsDeleting(false);
    }
  };

  const toggleCategoryFavorite = (cat: string) => {
    const isFav = settings.favoriteCategories.includes(cat);
    if (isFav) {
      setSetting("favoriteCategories", settings.favoriteCategories.filter(c => c !== cat));
    } else {
      setSetting("favoriteCategories", [...settings.favoriteCategories, cat]);
    }
  };

  const disableCategory = (cat: string) => {
    setSetting("hiddenCategories", [...settings.hiddenCategories, cat]);
    if (settings.favoriteCategories.includes(cat)) {
      setSetting("favoriteCategories", settings.favoriteCategories.filter(c => c !== cat));
    }
  };

  const enableCategory = (cat: string) => {
    setSetting("hiddenCategories", settings.hiddenCategories.filter(c => c !== cat));
  };

  const enabledCategories = CANONICAL_CATEGORIES.filter(cat => !settings.hiddenCategories.includes(cat));
  const disabledCategories = CANONICAL_CATEGORIES.filter(cat => settings.hiddenCategories.includes(cat));

  const aiModels = MODEL_REGISTRY.filter(m => ALLOWED_AI_MODELS.includes(m.id));

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
              Basic interface and profile preferences.
            </p>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              {session?.user && (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                        {getInitials(session.user.name, session.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="text-xl font-bold">{session.user.name || "Anonymous User"}</h3>
                      <p className="text-sm text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

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

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Home Page View</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose how the home page presents news to you.
                  </p>
                </div>
                <Select value={settings.homePageMode} onValueChange={(v: HomePageMode) => setSetting("homePageMode", v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="continuous">Continuous Feed</SelectItem>
                    <SelectItem value="daily">Daily View (Today's News)</SelectItem>
                    <SelectItem value="hourly">Shift View (4-Hour Blocks)</SelectItem>
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
                    {aiModels.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                    ))}
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

        {/* Notifications Settings */}
        <section id="notifications" className="scroll-mt-32 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure external channels and alerts for your topics.
            </p>
          </div>
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
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label className="text-base">Active Categories</Label>
                  <p className="text-sm text-muted-foreground">
                    Click a category to toggle favorite status. <span className="font-medium text-primary">Primary</span> = Favorite. <span className="text-muted-foreground">Gray</span> = Neutral.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {enabledCategories.map(cat => {
                    const isFav = settings.favoriteCategories.includes(cat);
                    
                    let pillStyle = "bg-muted text-muted-foreground hover:bg-muted/80";
                    if (isFav) pillStyle = "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90";
                    
                    return (
                      <div key={cat} className="flex items-center">
                        <button 
                          onClick={() => toggleCategoryFavorite(cat)} 
                          className={`px-4 py-1.5 rounded-l-full text-sm font-medium transition-colors ${pillStyle}`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                        <button 
                          onClick={() => disableCategory(cat)}
                          className="px-2.5 py-1.5 rounded-r-full bg-muted/60 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Hide Category"
                        >
                          &times;
                        </button>
                      </div>
                    )
                  })}
                  {enabledCategories.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">All categories are hidden.</span>
                  )}
                </div>

                {disabledCategories.length > 0 && (
                  <div className="pt-4 space-y-4">
                    <Separator />
                    <div className="space-y-1">
                      <Label className="text-base">More Categories</Label>
                      <p className="text-sm text-muted-foreground">
                        These are hidden from your feed. Click to add them back.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {disabledCategories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => enableCategory(cat)} 
                          className="px-4 py-1.5 rounded-full text-sm font-medium border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                        >
                          + {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <SourcesSection />

            <Card className="border-destructive/30">
              <CardContent className="p-6">
                <div className="space-y-1 mb-4">
                  <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete your account, including your saved topics, custom sources, bookmarks, and chat history.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm font-medium">
                        Please type <span className="font-bold select-none text-foreground">DELETE</span> to confirm.
                      </p>
                      <Input 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="max-w-[200px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" disabled={deleteConfirmText !== "DELETE" || isDeleting} onClick={handleDeleteAccount}>
                        {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
