"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CANONICAL_CATEGORIES, EXTRA_CATEGORIES } from "@/lib/constants";
import type { AllSettings } from "@/store";

interface AdvancedCategoriesSectionProps {
  settings: {
    favoriteCategories: string[];
    hiddenCategories: string[];
    extraCategories: string[];
  };
  onSettingChange: <K extends keyof AllSettings>(key: K, value: AllSettings[K]) => void;
}

export default function AdvancedCategoriesSection({ settings, onSettingChange }: AdvancedCategoriesSectionProps) {
  const toggleCategoryFavorite = (cat: string) => {
    const isFav = settings.favoriteCategories.includes(cat);
    const updated = isFav 
      ? settings.favoriteCategories.filter(c => c !== cat)
      : [...settings.favoriteCategories, cat];
    onSettingChange("favoriteCategories", updated);
  };

  const disableCategory = (cat: string) => {
    if (EXTRA_CATEGORIES.includes(cat)) {
      onSettingChange("extraCategories", (settings.extraCategories || []).filter(c => c !== cat));
    } else {
      onSettingChange("hiddenCategories", [...settings.hiddenCategories, cat]);
    }
    if (settings.favoriteCategories.includes(cat)) {
      onSettingChange("favoriteCategories", settings.favoriteCategories.filter(c => c !== cat));
    }
  };

  const enableCategory = (cat: string) => {
    if (EXTRA_CATEGORIES.includes(cat)) {
      onSettingChange("extraCategories", [...(settings.extraCategories || []), cat]);
    } else {
      onSettingChange("hiddenCategories", settings.hiddenCategories.filter(c => c !== cat));
    }
  };

  const enabledCategories = [
    ...CANONICAL_CATEGORIES.filter(cat => !settings.hiddenCategories.includes(cat)),
    // TODO: Enable once NLP/ML categorization is added to the ingestion service
    // ...EXTRA_CATEGORIES.filter(cat => (settings.extraCategories || []).includes(cat))
  ];
  const disabledCategories = [
    ...CANONICAL_CATEGORIES.filter(cat => settings.hiddenCategories.includes(cat)),
    // TODO: Enable once NLP/ML categorization is added to the ingestion service
    // ...EXTRA_CATEGORIES.filter(cat => !(settings.extraCategories || []).includes(cat))
  ];

  return (
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
  );
}
