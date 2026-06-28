import { Badge } from "@/components/ui/badge";

interface ImpactBadgeProps {
  impact?: string | null;
  className?: string;
}

export function getImpactColor(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "HIGH":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

export function ImpactBadge({ impact, className = "" }: ImpactBadgeProps) {
  if (impact) {
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-bold uppercase tracking-widest ${getImpactColor(impact)} ${className}`}
      >
        {impact}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/10"
    >
      Story
    </Badge>
  );
}