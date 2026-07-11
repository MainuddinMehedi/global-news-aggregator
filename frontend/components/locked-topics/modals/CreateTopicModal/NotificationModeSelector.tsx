import { Label } from "@/components/ui/label";
import {
  AlertCircleIcon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface NotificationModeSelectorProps {
  mode: "DIGEST" | "ALERT";
  onModeChange: (mode: "DIGEST" | "ALERT") => void;
}

export function NotificationModeSelector({
  mode,
  onModeChange,
}: NotificationModeSelectorProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-secondary bg-secondary/5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={mode === "DIGEST" ? Notification03Icon : AlertCircleIcon}
            size={16}
          />
        </div>
        <Label className="text-xs font-bold">Mode</Label>
      </div>

      <div className="flex rounded-lg border border-secondary overflow-hidden">
        <button
          type="button"
          onClick={() => onModeChange("DIGEST")}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            mode === "DIGEST"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Digest
        </button>
        <button
          type="button"
          onClick={() => onModeChange("ALERT")}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            mode === "ALERT"
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Alert
        </button>
      </div>
    </div>
  );
}
