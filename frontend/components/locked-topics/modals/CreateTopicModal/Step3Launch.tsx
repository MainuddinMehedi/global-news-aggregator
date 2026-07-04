"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreateTopicData } from "@/types/lockedTopic";
import { Notification03Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationChannelToggle } from "./NotificationChannelToggle";
import { NotificationModeSelector } from "./NotificationModeSelector";
import { TopicRecapCard } from "./TopicRecapCard";

interface Step3Props {
  data: CreateTopicData;
  setData: (data: CreateTopicData) => void;
  onPrev: () => void;
  onComplete: () => void;
  topicId?: string;
}

export default function Step3Launch({
  data,
  setData,
  onPrev,
  onComplete,
  topicId,
}: Step3Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleActivate = async () => {
    setLoading(true);

    try {
      const isEdit = !!topicId;
      const endpoint = isEdit
        ? `/api/locked-topics/${topicId}`
        : "/api/locked-topics";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok)
        throw new Error(isEdit ? "Update failed" : "Activation failed");

      const resData = await res.json();
      const targetId = isEdit ? topicId : resData.id;

      fetch(`/api/locked-topics/${targetId}/scan`, { method: "POST" });

      toast.success(
        isEdit
          ? "Tracker updated successfully!"
          : "Tracker activated and scanning initiated!",
      );

      onComplete();
      router.refresh();
    } catch (err) {
      toast.error(
        topicId ? "Failed to update tracker" : "Failed to activate tracker",
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-6 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border-2 border-green-500/20 shadow-inner">
          <HugeiconsIcon icon={Tick01Icon} size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black tracking-tight">
            Ready for Launch
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Your surveillance for{" "}
            <span className="text-foreground font-bold">
              &quot;{data.displayName}&quot;
            </span>{" "}
            is {topicId ? "updated" : "configured"}. Review the summary below
            and launch.
          </p>
        </div>
      </div>

      {/* Recap section */}
      <TopicRecapCard data={data} />

      {/* Notification preferences */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Notification Preferences
        </h4>

        <div className="space-y-3">
          <div
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
              data.notifyEnabled
                ? "border-primary/20 bg-primary/5"
                : "border-secondary bg-secondary/10"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl transition-all ${
                  data.notifyEnabled
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <HugeiconsIcon icon={Notification03Icon} size={22} />
              </div>
              <div>
                <p className="text-sm font-bold">Notifications</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {data.notifyMode === "DIGEST"
                    ? "Digest Mode (2h interval)"
                    : "Alert Mode (real-time)"}
                </p>
              </div>
            </div>
            <Switch
              checked={data.notifyEnabled}
              onCheckedChange={(v) => setData({ ...data, notifyEnabled: v })}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {data.notifyEnabled && (
            <div className="space-y-3 pl-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Notify mode selector */}
              <NotificationModeSelector
                mode={data.notifyMode}
                onModeChange={(v) => setData({ ...data, notifyMode: v })}
              />

              {/* Channel toggles */}
              <NotificationChannelToggle
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="hugeicons-icon"
                  >
                    <path d="M9.5 17.5L8 21L15 17.5" />
                    <path d="M9.5 6.5L11 3L18 6.5" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
                label="Discord"
                isActive={data.notifyChannels.discord}
                onToggle={(v) =>
                  setData({
                    ...data,
                    notifyChannels: { ...data.notifyChannels, discord: v },
                  })
                }
              />

              <NotificationChannelToggle
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="hugeicons-icon"
                  >
                    <path d="M21.5 2.5L2.5 9.5L9.5 13.5" />
                    <path d="M9.5 13.5L13.5 21.5L21.5 2.5" />
                  </svg>
                }
                label="Telegram"
                isActive={data.notifyChannels.telegram}
                onToggle={(v) =>
                  setData({
                    ...data,
                    notifyChannels: { ...data.notifyChannels, telegram: v },
                  })
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="flex-1 rounded-xl py-7 border-secondary hover:bg-secondary/20"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleActivate}
          className="flex-2 rounded-xl py-7 font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all bg-primary hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>{topicId ? "Updating..." : "Activating..."}</span>
            </div>
          ) : topicId ? (
            "Update Tracker"
          ) : (
            "Launch Tracker"
          )}
        </Button>
      </div>
    </div>
  );
}
