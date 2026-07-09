"use client";

import { updateSingleSettingAction } from "@/app/actions/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES } from "@/lib/constants";
import { DbSettings } from "@/store";
import { startTransition, useOptimistic } from "react";

interface AdvancedCategoriesSectionProps {
  dbSettings: Partial<DbSettings>;
}

export default function AdvancedCategoriesSection({
  dbSettings,
}: AdvancedCategoriesSectionProps) {
  const initialFavoriteCategories = dbSettings.favoriteCategories || [];
  const initialHiddenCategories = dbSettings.hiddenCategories || [];

  const [favoriteCategories, setFavoriteCategories] = useOptimistic(
    initialFavoriteCategories,
    (_, updated: string[]) => updated,
  );
  const [hiddenCategories, setHiddenCategories] = useOptimistic(
    initialHiddenCategories,
    (_, updated: string[]) => updated,
  );

  const toggleCategoryFavorite = (cat: string) => {
    startTransition(() => {
      const isFav = favoriteCategories.includes(cat);
      const updated = isFav
        ? favoriteCategories.filter((c) => c !== cat)
        : [...favoriteCategories, cat];
      setFavoriteCategories(updated);
      updateSingleSettingAction("favoriteCategories", updated);
    });
  };

  const disableCategory = (cat: string) => {
    startTransition(() => {
      const updated = [...hiddenCategories, cat];
      setHiddenCategories(updated);
      updateSingleSettingAction("hiddenCategories", updated);

      if (favoriteCategories.includes(cat)) {
        const updatedFav = favoriteCategories.filter((c) => c !== cat);
        setFavoriteCategories(updatedFav);
        updateSingleSettingAction("favoriteCategories", updatedFav);
      }
    });
  };

  const enableCategory = (cat: string) => {
    startTransition(() => {
      const updated = hiddenCategories.filter((c) => c !== cat);
      setHiddenCategories(updated);
      updateSingleSettingAction("hiddenCategories", updated);
    });
  };

  const enabledCategories = [
    ...CANONICAL_CATEGORIES.filter((cat) => !hiddenCategories.includes(cat)),
  ];
  const disabledCategories = [
    ...CANONICAL_CATEGORIES.filter((cat) => hiddenCategories.includes(cat)),
  ];

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <Label className="text-base">Active Categories</Label>
          <p className="text-sm text-muted-foreground">
            Click a category to toggle favorite status.{" "}
            <span className="font-medium text-primary">Primary</span> =
            Favorite. <span className="text-muted-foreground">Gray</span> =
            Neutral.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {enabledCategories.map((cat) => {
            const isFav = favoriteCategories.includes(cat);

            let pillStyle = "bg-muted text-muted-foreground hover:bg-muted/80";
            if (isFav)
              pillStyle =
                "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90";

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
            );
          })}
          {enabledCategories.length === 0 && (
            <span className="text-sm text-muted-foreground italic">
              All categories are hidden.
            </span>
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
              {disabledCategories.map((cat) => (
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
  );
}
