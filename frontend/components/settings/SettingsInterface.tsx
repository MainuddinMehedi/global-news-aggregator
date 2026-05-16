"use client";

import { useEffect, useState } from "react";
import { useSettings, type ResponseStyle } from "@/store";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES } from "@/lib/constants";

export default function SettingsInterface() {
  const [mounted, setMounted] = useState(false);
  const { settings, setSetting } = useSettings();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        <div className="h-64 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="ai">AI & Chat</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>

      {/* General Settings */}
      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic interface and display preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
      </TabsContent>

      {/* Feed Settings */}
      <TabsContent value="feed">
        <Card>
          <CardHeader>
            <CardTitle>Feed Preferences</CardTitle>
            <CardDescription>
              Control how news articles are displayed and sorted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
      </TabsContent>

      {/* AI & Chat Settings */}
      <TabsContent value="ai">
        <Card>
          <CardHeader>
            <CardTitle>AI & Analysis Preferences</CardTitle>
            <CardDescription>
              Configure the AI assistant and analysis transparency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
              <div className="space-y-0.5">
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
      </TabsContent>

      {/* Categories Settings */}
      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>
              Personalize your feed by favoring or hiding specific topics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <Label>Hidden Categories</Label>
              <p className="text-sm text-muted-foreground">
                Articles from these categories will be removed from your main
                feed.
              </p>
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
                          : settings.hiddenCategories.filter((c) => c !== cat);
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
      </TabsContent>
    </Tabs>
  );
}
