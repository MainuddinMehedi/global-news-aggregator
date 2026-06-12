"use client";

import { useSettings, type NotificationMode } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function NotificationsSection() {
  const { settings, setSetting } = useSettings();
  const channels = settings.notificationChannels;

  const updateChannel = (key: keyof typeof channels, value: string) => {
    const updatedChannels = { ...channels, [key]: value };
    setSetting("notificationChannels", updatedChannels);
    
    // Fire and forget server action to persist
    import("@/app/actions/settings").then((m) => {
      m.updateSingleSettingAction("notificationChannels", updatedChannels)
        .catch(err => console.error("Failed to save notification settings", err));
    });
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Notification Mode</Label>
            <p className="text-sm text-muted-foreground">
              Choose how you want to receive alerts for your Locked Topics.
            </p>
          </div>
          <Select 
            value={channels.mode} 
            onValueChange={(v: NotificationMode) => updateChannel("mode", v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="digest">Digest (Periodic)</SelectItem>
              <SelectItem value="alert">Alert (Immediate)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Telegram Configuration</Label>
            <p className="text-sm text-muted-foreground">Enter your Telegram Chat ID to receive updates via the bot.</p>
          </div>
          <Input 
            placeholder="e.g. 123456789" 
            value={channels.telegram} 
            onChange={(e) => updateChannel("telegram", e.target.value)}
            className="max-w-md"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Discord Configuration</Label>
            <p className="text-sm text-muted-foreground">Enter your Discord Webhook URL for channel notifications.</p>
          </div>
          <Input 
            placeholder="https://discord.com/api/webhooks/..." 
            value={channels.discord} 
            onChange={(e) => updateChannel("discord", e.target.value)}
            className="max-w-md"
          />
        </div>

      </CardContent>
    </Card>
  );
}
