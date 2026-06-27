"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AdminNotificationConfig } from "@news/db";

interface NotificationConfigTabProps {
  configs: AdminNotificationConfig[];
}

export default function NotificationConfigTab({ configs }: NotificationConfigTabProps) {
  return (
    <Card className="bg-card/45 border-border/50 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
        <div>
          <h3 className="font-bold text-sm text-foreground">Admin Notification Channels</h3>
          <p className="text-xs text-muted-foreground">
            Configure system alerts, target webhooks, and cooldown limits.
          </p>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/30 text-muted-foreground font-semibold">
                <th className="px-5 py-3">Alert Type</th>
                <th className="px-5 py-3">In-App</th>
                <th className="px-5 py-3">Discord</th>
                <th className="px-5 py-3">Telegram</th>
                <th className="px-5 py-3">Cooldown (Mins)</th>
                <th className="px-5 py-3">Channel Endpoints (Webhooks & Chat IDs)</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground italic">
                    No notification configurations found. Run seeding scripts.
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <NotificationConfigRow key={config.id} config={config} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationConfigRowProps {
  config: AdminNotificationConfig;
}

function NotificationConfigRow({ config }: NotificationConfigRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for row modifications
  const [inAppEnabled, setInAppEnabled] = useState(config.inAppEnabled);
  const [discordEnabled, setDiscordEnabled] = useState(config.discordEnabled);
  const [telegramEnabled, setTelegramEnabled] = useState(config.telegramEnabled);
  const [discordWebhook, setDiscordWebhook] = useState(config.discordWebhook || "");
  const [telegramChatId, setTelegramChatId] = useState(config.telegramChatId || "");
  const [cooldownMinutes, setCooldownMinutes] = useState(config.cooldownMinutes);

  const hasChanges =
    inAppEnabled !== config.inAppEnabled ||
    discordEnabled !== config.discordEnabled ||
    telegramEnabled !== config.telegramEnabled ||
    discordWebhook !== (config.discordWebhook || "") ||
    telegramChatId !== (config.telegramChatId || "") ||
    cooldownMinutes !== config.cooldownMinutes;

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/admin-config", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: config.type,
            inAppEnabled,
            discordEnabled,
            telegramEnabled,
            discordWebhook: discordWebhook.trim() || null,
            telegramChatId: telegramChatId.trim() || null,
            cooldownMinutes: Number(cooldownMinutes),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }

        toast.success(`Settings for ${config.type} updated.`);
        router.refresh();
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        toast.error(`Update failed: ${message}`);
      }
    });
  };

  return (
    <tr className="hover:bg-muted/10 transition-colors">
      <td className="px-5 py-3.5 font-bold text-foreground max-w-xs break-words">
        {config.type.replace(/_/g, " ")}
      </td>
      <td className="px-5 py-3.5">
        <Switch
          checked={inAppEnabled}
          disabled={isPending}
          onCheckedChange={setInAppEnabled}
          className="cursor-pointer"
        />
      </td>
      <td className="px-5 py-3.5">
        <Switch
          checked={discordEnabled}
          disabled={isPending}
          onCheckedChange={setDiscordEnabled}
          className="cursor-pointer"
        />
      </td>
      <td className="px-5 py-3.5">
        <Switch
          checked={telegramEnabled}
          disabled={isPending}
          onCheckedChange={setTelegramEnabled}
          className="cursor-pointer"
        />
      </td>
      <td className="px-5 py-3.5">
        <Input
          type="number"
          value={cooldownMinutes}
          disabled={isPending}
          onChange={(e) => setCooldownMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="w-16 h-8 text-xs font-semibold rounded-lg px-2 py-1 text-center"
        />
      </td>
      <td className="px-5 py-3.5 space-y-1.5 max-w-xs md:max-w-md">
        {discordEnabled && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground w-12 shrink-0">
              Discord
            </span>
            <Input
              type="text"
              placeholder="Webhook URL (https://...)"
              value={discordWebhook}
              disabled={isPending}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="h-7 text-[10px] font-mono rounded-lg flex-1"
            />
          </div>
        )}
        {telegramEnabled && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground w-12 shrink-0">
              Telegram
            </span>
            <Input
              type="text"
              placeholder="Chat ID (e.g. -100...)"
              value={telegramChatId}
              disabled={isPending}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="h-7 text-[10px] font-mono rounded-lg flex-1"
            />
          </div>
        )}
        {!discordEnabled && !telegramEnabled && (
          <span className="text-muted-foreground italic text-[10px]">End-points inactive</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <Button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          size="sm"
          className="h-8 rounded-xl px-3 text-xs font-bold gap-1 cursor-pointer bg-primary text-primary-foreground shadow-md hover:bg-primary/95 disabled:opacity-40"
        >
          <HugeiconsIcon icon={Tick01Icon} size={14} />
          Save
        </Button>
      </td>
    </tr>
  );
}
