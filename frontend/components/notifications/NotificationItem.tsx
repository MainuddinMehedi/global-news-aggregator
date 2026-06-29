import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Clock01Icon,
  RefreshIcon,
  Sparkles,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Notification, NotificationType } from "@news/db";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  // Resolve Icon and Color based on type
  const getIconAndColor = (type: NotificationType) => {
    switch (type) {
      case "PIPELINE_FAILURE":
      case "HIGH_FAILURE_RATE":
        return {
          icon: Alert01Icon,
          bgClass: "bg-destructive/10 text-destructive",
          accentClass: "border-destructive",
        };
      case "INGESTION_STALLED":
        return {
          icon: Clock01Icon,
          bgClass: "bg-amber-500/10 text-amber-500",
          accentClass: "border-amber-500",
        };
      case "AI_PROVIDER_DEGRADED":
        return {
          icon: Sparkles,
          bgClass: "bg-purple-500/10 text-purple-500",
          accentClass: "border-purple-500",
        };
      case "REVALIDATION_FAILED":
        return {
          icon: RefreshIcon,
          bgClass: "bg-cyan-500/10 text-cyan-500",
          accentClass: "border-cyan-500",
        };
      case "TOPIC_SOURCE_DEGRADED":
      case "TOPIC_SCAN_DEGRADED":
        return {
          icon: Alert01Icon,
          bgClass: "bg-amber-500/10 text-amber-500",
          accentClass: "border-amber-500",
        };
      default:
        return {
          icon: InformationCircleIcon,
          bgClass: "bg-primary/10 text-primary",
          accentClass: "border-primary",
        };
    }
  };

  const { icon, bgClass, accentClass } = getIconAndColor(notification.type);

  return (
    <div
      onClick={onClick}
      className={`p-4 transition-all duration-300 flex gap-3 cursor-pointer select-none hover:bg-muted/40 border-l-2 ${
        isUnread ? `${accentClass} bg-muted/20` : "border-transparent"
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgClass}`}>
        <HugeiconsIcon icon={icon} size={16} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
            {notification.type.replace(/_/g, " ")}
          </span>
          <RelativeTime
            date={notification.createdAt}
            className="text-[9px] font-medium text-muted-foreground/60"
          />
        </div>

        <h4 className={`text-xs font-bold leading-snug break-words ${isUnread ? "text-foreground" : "text-foreground/80 font-semibold"}`}>
          {notification.title}
        </h4>

        <p className="text-[10px] text-muted-foreground leading-normal whitespace-pre-line line-clamp-3">
          {notification.message}
        </p>
      </div>
    </div>
  );
}
