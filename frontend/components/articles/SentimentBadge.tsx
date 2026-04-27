import { cn, getSentimentInfo } from "@/lib/utils";

interface SentimentBadgeProps {
  score: number | null | undefined;
  showScore?: boolean;
  className?: string;
}

export function SentimentBadge({
  score,
  showScore = true,
  className,
}: SentimentBadgeProps) {
  const { label, color, bgColor } = getSentimentInfo(score);

  return (
    <span
      className={cn(
        "inline-flex items-center space-x-1 text-[10px] font-medium",
        color,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-emerald-400": label === "Positive",
          "bg-rose-400": label === "Negative",
          "bg-zinc-500": label === "Neutral" || label === "N/A",
        })}
      />
      {showScore && score != null && (
        <span>{score.toFixed(2)}</span>
      )}
    </span>
  );
}
