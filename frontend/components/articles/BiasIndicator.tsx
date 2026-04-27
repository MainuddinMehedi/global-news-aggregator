import { cn, biasStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BiasIndicatorProps {
  biasCategory: string | null;
  className?: string;
}

export function BiasIndicator({ biasCategory, className }: BiasIndicatorProps) {
  if (!biasCategory) return null;

  const styles = biasStyles[biasCategory] || biasStyles.Neutral;

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-medium border inline-flex items-center",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {biasCategory}
    </span>
  );
}
