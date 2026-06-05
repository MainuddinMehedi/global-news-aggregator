"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  Notification03Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreateTopicData } from "@/types/lockedTopic";

interface Step4Props {
  data: CreateTopicData;
  onPrev: () => void;
  onComplete: () => void;
  topicId?: string;
}

export default function Step4Confirm({
  data,
  onPrev,
  onComplete,
  topicId,
}: Step4Props) {
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState(true);
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
        body: JSON.stringify({
          ...data,
          notifyEnabled: notify,
        }),
      });

      if (!res.ok)
        throw new Error(isEdit ? "Update failed" : "Activation failed");

      const resData = await res.json();
      const targetId = isEdit ? topicId : resData.id;

      // Trigger initial scan (fire and forget)
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
            is {topicId ? "updated" : "configured"}. We&apos;ll start monitoring
            all selected sources immediately.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 rounded-2xl border border-primary/20 bg-primary/5 group hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <HugeiconsIcon icon={Notification03Icon} size={22} />
            </div>
            <div>
              <p className="text-sm font-bold">Intelligent Notifications</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Digest Mode (2h interval)
              </p>
            </div>
          </div>
          <Switch
            checked={notify}
            onCheckedChange={setNotify}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl border border-secondary bg-secondary/10 opacity-40 grayscale cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary text-muted-foreground">
              <HugeiconsIcon icon={Mail01Icon} size={22} />
            </div>
            <div>
              <p className="text-sm font-bold">External Webhooks</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Discord / Telegram Hook
              </p>
            </div>
          </div>
          <Switch checked={false} disabled />
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex-1 rounded-xl py-7 border-secondary hover:bg-secondary/20"
          disabled={loading}
        >
          Back
        </Button>
        <Button
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
