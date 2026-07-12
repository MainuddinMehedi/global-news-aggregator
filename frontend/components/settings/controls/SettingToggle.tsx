"use client";

import { updateSingleSettingAction } from "@/app/actions/settings";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";
import { startTransition, useOptimistic } from "react";
import { toast } from "sonner";
import type { DbSettings } from "@/types/settings";

interface SettingToggleProps {
  settingKey: keyof DbSettings;
  initialValue: boolean;
  disabled?: boolean;
}

export default function SettingToggle({
  settingKey,
  initialValue,
  disabled = false,
}: SettingToggleProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(
    initialValue,
    (_, newValue: boolean) => newValue,
  );
  const { status } = useSession();

  const handleCheckedChange = (checked: boolean) => {
    startTransition(() => {
      setOptimisticValue(checked);

      if (status === "authenticated") {
        updateSingleSettingAction(settingKey, checked).catch((err) => {
          console.error(`Failed to sync setting ${settingKey}:`, err);
          toast.error("Failed to save setting");
        });
      }
    });
  };

  return (
    <Switch
      checked={optimisticValue}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
    />
  );
}
