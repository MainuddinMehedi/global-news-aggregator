import { Metadata } from "next";
import SettingsInterface from "@/components/settings/SettingsInterface";

export const metadata: Metadata = {
  title: "Settings | Global News Aggregator",
  description: "Manage your preferences and app settings",
};

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your news feed, AI preferences, and display settings.
        </p>
      </div>

      <SettingsInterface />
    </div>
  );
}
