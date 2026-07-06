"use client";

import { SettingsState, useAppStore } from "@/store";
import { useEffect, useRef } from "react";

interface StoreHydratorProps {
  dbSettings: Partial<SettingsState>;
  isAuthenticated: boolean;
}

/**
 * An invisible client component that synchronizes the database settings
 * fetched by a Server Component into the Zustand client store.
 * It prevents hydration mismatches and UI desync on initial load.
 *
 * If the user is unauthenticated, it resets authenticated-only settings to their defaults
 * so that lingering data from previous logged-in sessions is cleared.
 */
export function StoreHydrator({
  dbSettings,
  isAuthenticated,
}: StoreHydratorProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (isAuthenticated && dbSettings && Object.keys(dbSettings).length > 0) {
        // Logged in: Sync database settings into the browser's persistent store
        useAppStore.setState((state) => ({ ...state, ...dbSettings }));
      } else if (!isAuthenticated) {
        // Logged out: Erase any lingering authenticated-only settings
        useAppStore.setState((state) => ({
          ...state,
          feedDefaultCategory: "all",
          feedDefaultRegion: "all",
          feedDefaultSort: "latest",
          articlesPerPage: 20,
          favoriteCategories: [],
          hiddenCategories: [],
          extraCategories: [],
          homePageMode: "continuous",
          hasOnboardedSources: false,
          defaultAiModel: "groq/compound",
          responseStyle: "concise",
          // Note: theme, colorTheme, and isSidebarCollapsed are intentionally
          // preserved since unauthenticated users can configure them.
        }));
      }
      initialized.current = true;
    }
  }, [dbSettings, isAuthenticated]);

  return null;
}
