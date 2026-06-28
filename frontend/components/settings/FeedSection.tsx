"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CANONICAL_CATEGORIES } from "@/lib/constants";
import type { SettingsState } from "@/store";

interface FeedSectionProps {
  settings: {
    feedDefaultCategory: string;
    feedDefaultSort: string;
    articlesPerPage: number;
  };
  onSettingChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

export default function FeedSection({ settings, onSettingChange }: FeedSectionProps) {
  return (
    <>
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
              onValueChange={(v) => onSettingChange("feedDefaultCategory", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All News</SelectItem>
                {/* TODO: Use ALL_CATEGORIES once NLP/ML categorization is added to the ingestion service */}
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
              onValueChange={(v) => onSettingChange("feedDefaultSort", v)}
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
                onSettingChange("articlesPerPage", parseInt(v))
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
    </>
  );
}
