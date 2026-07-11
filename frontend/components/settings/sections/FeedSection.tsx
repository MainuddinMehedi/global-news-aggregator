import SettingSelect from "@/components/settings/controls/SettingSelect";
import { FeedSectionSkeleton } from "@/components/skeletons/settings/FeedSectionSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES, CANONICAL_REGIONS } from "@/lib/constants";
import { getCachedUserSettings } from "@/queries/userSettings";
import { Suspense } from "react";

export default function FeedSection() {
  return (
    <>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feed Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control how news articles are displayed and sorted.
        </p>
      </div>

      <Card>
        <Suspense fallback={<FeedSectionSkeleton />}>
          <FeedSectionContent />
        </Suspense>
      </Card>
    </>
  );
}

async function FeedSectionContent() {
  const dbSettings = await getCachedUserSettings();

  return (
    <CardContent className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Home Page View</Label>
          <p className="text-sm text-muted-foreground">
            Choose how the home page presents news to you.
          </p>
        </div>
        <SettingSelect
          settingKey="homePageMode"
          initialValue={dbSettings.homePageMode || "continuous"}
          options={[
            { value: "continuous", label: "Continuous Feed" },
            { value: "daily", label: "Daily View (Today's News)" },
          ]}
          placeholder="Select view mode"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Default Region</Label>
          <p className="text-sm text-muted-foreground">
            Choose which region loads by default.
          </p>
        </div>
        <SettingSelect
          settingKey="feedDefaultRegion"
          initialValue={dbSettings.feedDefaultRegion || "all"}
          options={[
            { value: "all", label: "All Regions" },
            ...CANONICAL_REGIONS.map((region) => ({
              value: region,
              label: region,
            })),
          ]}
          placeholder="Select region"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Default Category</Label>
          <p className="text-sm text-muted-foreground">
            Choose which category loads by default.
          </p>
        </div>
        <SettingSelect
          settingKey="feedDefaultCategory"
          initialValue={dbSettings.feedDefaultCategory || "all"}
          options={[
            { value: "all", label: "All News" },
            ...CANONICAL_CATEGORIES.map((cat) => ({
              value: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
            })),
          ]}
          placeholder="Select category"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Default Sort</Label>
          <p className="text-sm text-muted-foreground">
            Preferred order for news articles.
          </p>
        </div>
        <SettingSelect
          settingKey="feedDefaultSort"
          initialValue={dbSettings.feedDefaultSort || "latest"}
          options={[
            { value: "latest", label: "Latest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "bias", label: "Most Biased" },
          ]}
          placeholder="Select sort"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Articles Per Page</Label>
          <p className="text-sm text-muted-foreground">
            Number of articles to load at once.
          </p>
        </div>
        <SettingSelect
          settingKey="articlesPerPage"
          initialValue={(dbSettings.articlesPerPage || 20).toString()}
          options={[
            { value: "10", label: "10" },
            { value: "20", label: "20" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
          placeholder="Select count"
          valueType="number"
        />
      </div>
    </CardContent>
  );
}
