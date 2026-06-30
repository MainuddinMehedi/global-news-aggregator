import { Badge } from "@/components/ui/badge";
import { METADATA_COLORS } from "@/utils/colors";

interface ImpactBadgeProps {
  impact?: string | null;
  className?: string;
}

export function getImpactColorHex(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL":
      return METADATA_COLORS.impact.CRITICAL;
    case "HIGH":
      return METADATA_COLORS.impact.HIGH;
    case "MEDIUM":
      return METADATA_COLORS.impact.MEDIUM;
    case "LOW":
      return METADATA_COLORS.impact.LOW;
    default:
      return "#3b82f6"; // default primary
  }
}

export function ImpactBadge({ impact, className = "" }: ImpactBadgeProps) {
  if (impact) {
    const hex = getImpactColorHex(impact);

    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-bold uppercase tracking-widest ${className}`}
        style={{
          color: hex,
          backgroundColor: `${hex}1A`, // 10% opacity
          borderColor: `${hex}33`, // 20% opacity
        }}
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
