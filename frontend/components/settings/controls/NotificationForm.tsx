"use client";

import { saveNotificationPreferenceAction } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface NotificationFormProps {
  initialPreferences: {
    inAppEnabled: boolean;
    discordEnabled: boolean;
    telegramEnabled: boolean;
    discordWebhook: string | null;
    telegramChatId: string | null;
    digestEnabled: boolean;
  };
}

export default function NotificationForm({
  initialPreferences,
}: NotificationFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [inAppEnabled, setInAppEnabled] = useState(
    initialPreferences.inAppEnabled,
  );
  const [discordEnabled, setDiscordEnabled] = useState(
    initialPreferences.discordEnabled,
  );
  const [telegramEnabled, setTelegramEnabled] = useState(
    initialPreferences.telegramEnabled,
  );
  const [discordWebhook, setDiscordWebhook] = useState(
    initialPreferences.discordWebhook || "",
  );
  const [telegramChatId, setTelegramChatId] = useState(
    initialPreferences.telegramChatId || "",
  );
  const [digestEnabled, setDigestEnabled] = useState(
    initialPreferences.digestEnabled,
  );

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveNotificationPreferenceAction({
          inAppEnabled,
          discordEnabled,
          telegramEnabled,
          discordWebhook: discordWebhook.trim() || null,
          telegramChatId: telegramChatId.trim() || null,
          digestEnabled,
        });
        toast.success("Notification preferences saved successfully.");
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        toast.error(`Failed to save preferences: ${message}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Mode */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="font-bold text-sm">Delivery Mode</Label>
          <p className="text-xs text-muted-foreground">
            Choose how you want to receive alerts (immediate alerts vs periodic
            digests).
          </p>
        </div>
        <Select
          value={digestEnabled ? "digest" : "alert"}
          onValueChange={(v) => setDigestEnabled(v === "digest")}
          disabled={isPending}
        >
          <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl font-bold">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="alert" className="text-xs rounded-lg">
              Alert (Immediate)
            </SelectItem>
            <SelectItem value="digest" className="text-xs rounded-lg">
              Digest (Periodic)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* In App Feed */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="font-bold text-sm">In-App Feed Notifications</Label>
          <p className="text-xs text-muted-foreground">
            Show unread badge in the navigation bar and list alerts in the
            notification page.
          </p>
        </div>
        <Switch
          checked={inAppEnabled}
          disabled={isPending}
          onCheckedChange={setInAppEnabled}
          className="cursor-pointer"
        />
      </div>

      <Separator />

      {/* Discord Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="font-bold text-sm">
              Discord Channel Integration
            </Label>
            <p className="text-xs text-muted-foreground">
              Receive real-time alerts directly in your Discord channel.
            </p>
          </div>
          <Switch
            checked={discordEnabled}
            disabled={isPending}
            onCheckedChange={setDiscordEnabled}
            className="cursor-pointer"
          />
        </div>
        {discordEnabled && (
          <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-xs font-bold text-muted-foreground">
              Discord Webhook URL
            </Label>
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              disabled={isPending}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="max-w-md h-9 text-xs rounded-xl font-mono"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Telegram Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="font-bold text-sm">
              Telegram Bot Integration
            </Label>
            <p className="text-xs text-muted-foreground">
              Get updates directly via the Telegram monitoring bot.
            </p>
          </div>
          <Switch
            checked={telegramEnabled}
            disabled={isPending}
            onCheckedChange={setTelegramEnabled}
            className="cursor-pointer"
          />
        </div>
        {telegramEnabled && (
          <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-xs font-bold text-muted-foreground">
              Telegram Chat ID
            </Label>
            <Input
              placeholder="e.g. 123456789"
              value={telegramChatId}
              disabled={isPending}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="max-w-md h-9 text-xs rounded-xl font-mono"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Action button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer bg-primary text-primary-foreground shadow-md hover:bg-primary/95 flex items-center gap-1.5"
        >
          <HugeiconsIcon icon={Tick01Icon} size={14} />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
