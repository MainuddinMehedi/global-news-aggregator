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
          <Label>Delivery Mode</Label>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive alerts (immediate alerts vs periodic
            digests).
          </p>
        </div>
        <Select
          value={digestEnabled ? "digest" : "alert"}
          onValueChange={(v) => setDigestEnabled(v === "digest")}
          disabled={isPending}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alert">
              Alert (Immediate)
            </SelectItem>
            <SelectItem value="digest">
              Digest (Periodic)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* In App Feed */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>In-App Feed Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Show unread badge in the navigation bar and list alerts in the
            notification page.
          </p>
        </div>
        <Switch
          checked={inAppEnabled}
          disabled={isPending}
          onCheckedChange={setInAppEnabled}
        />
      </div>

      <Separator />

      {/* Discord Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>
              Discord Channel Integration
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive real-time alerts directly in your Discord channel.
            </p>
          </div>
          <Switch
            checked={discordEnabled}
            disabled={isPending}
            onCheckedChange={setDiscordEnabled}
          />
        </div>
        {discordEnabled && (
          <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-sm text-muted-foreground">
              Discord Webhook URL
            </Label>
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              disabled={isPending}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="max-w-md font-mono"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Telegram Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>
              Telegram Bot Integration
            </Label>
            <p className="text-sm text-muted-foreground">
              Get updates directly via the Telegram monitoring bot.
            </p>
          </div>
          <Switch
            checked={telegramEnabled}
            disabled={isPending}
            onCheckedChange={setTelegramEnabled}
          />
        </div>
        {telegramEnabled && (
          <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-sm text-muted-foreground">
              Telegram Chat ID
            </Label>
            <Input
              placeholder="e.g. 123456789"
              value={telegramChatId}
              disabled={isPending}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="max-w-md font-mono"
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
          className="flex items-center gap-1.5"
        >
          <HugeiconsIcon icon={Tick01Icon} size={14} />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
