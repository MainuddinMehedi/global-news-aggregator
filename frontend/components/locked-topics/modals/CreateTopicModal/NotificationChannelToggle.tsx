import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReactNode } from "react";

interface NotificationChannelToggleProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onToggle: (checked: boolean) => void;
}

export function NotificationChannelToggle({
  icon,
  label,
  isActive,
  onToggle,
}: NotificationChannelToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-secondary bg-secondary/5">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <Label className="text-xs font-bold">{label}</Label>
      </div>

      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
