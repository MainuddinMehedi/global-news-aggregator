import { Switch } from "@/components/ui/switch";
import { HugeiconsIcon } from "@hugeicons/react";

interface SourceToggleProps {
  label: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  icon: any;
  enabled: boolean;
  onToggle: () => void;
}

export function SourceToggle({
  label,
  icon,
  enabled,
  onToggle,
}: SourceToggleProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${enabled ? "border-primary/30 bg-primary/5" : "border-secondary bg-transparent hover:border-secondary-foreground/20"}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg transition-colors ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          <HugeiconsIcon icon={icon} size={20} />
        </div>
        <p className="text-sm font-bold">{label}</p>
      </div>

      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
