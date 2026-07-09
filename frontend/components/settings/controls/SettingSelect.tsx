"use client";

import { updateSingleSettingAction } from "@/app/actions/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { startTransition, useOptimistic } from "react";
import { toast } from "sonner";

interface Option {
  value: string;
  label: string;
}

interface SettingSelectProps {
  settingKey: string;
  initialValue: string;
  options: Option[];
  placeholder?: string;
  width?: string;
}

export default function SettingSelect({
  settingKey,
  initialValue,
  options,
  placeholder = "Select an option",
  width = "w-[180px]",
  valueType = "string",
}: SettingSelectProps & { valueType?: "string" | "number" }) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(
    initialValue,
    (_, newValue: string) => newValue,
  );
  const { status } = useSession();

  const handleValueChange = (v: string) => {
    startTransition(() => {
      setOptimisticValue(v);

      if (status === "authenticated") {
        const parsedValue = valueType === "number" ? parseInt(v, 10) : v;
        updateSingleSettingAction(settingKey, parsedValue).catch((err) => {
          console.error(`Failed to sync setting ${settingKey}:`, err);
          toast.error("Failed to save setting");
        });
      }
    });
  };

  return (
    <Select value={optimisticValue} onValueChange={handleValueChange}>
      <SelectTrigger className={width}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
