"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES, CANONICAL_REGIONS } from "@/lib/constants";
import type { HomePageMode, AllSettings } from "@/store";

interface FeedSectionProps {
  settings: {
    homePageMode: HomePageMode;
    feedDefaultRegion: string;
    feedDefaultCategory: string;
    feedDefaultSort: string;
    articlesPerPage: number;
  };
  onSettingChange: <K extends keyof AllSettings>(
    key: K,
    value: AllSettings[K],
  ) => void;
}

export default function FeedSection({
  settings,
  onSettingChange,
}: FeedSectionProps) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feed Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control how news articles are displayed and sorted.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Home Page View</Label>
              <p className="text-sm text-muted-foreground">
                Choose how the home page presents news to you.
              </p>
            </div>
            <Select
              value={settings.homePageMode}
              onValueChange={(v: HomePageMode) =>
                onSettingChange("homePageMode", v)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continuous">Continuous Feed</SelectItem>
                <SelectItem value="daily">
                  Daily View (Today&apos;s News)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Default Region</Label>
              <p className="text-sm text-muted-foreground">
                Choose which region loads by default.
              </p>
            </div>
            <Select
              value={settings.feedDefaultRegion}
              onValueChange={(v) => onSettingChange("feedDefaultRegion", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {CANONICAL_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

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
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="bias">Most Biased</SelectItem>
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
