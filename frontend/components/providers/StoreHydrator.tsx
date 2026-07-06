"use client";

import { SettingsState, useAppStore } from "@/store";
import { useEffect, useRef } from "react";

interface StoreHydratorProps {
  dbSettings: Partial<SettingsState>;
}

/**
 * An invisible client component that synchronizes the database settings
 * fetched by a Server Component into the Zustand client store.
 * It prevents hydration mismatches and UI desync on initial load.
 */
export function StoreHydrator({ dbSettings }: StoreHydratorProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (
      !initialized.current &&
      dbSettings &&
      Object.keys(dbSettings).length > 0
    ) {
      useAppStore.setState((state) => ({ ...state, ...dbSettings }));
      initialized.current = true;
    }
  }, [dbSettings]);

  return null;
}
