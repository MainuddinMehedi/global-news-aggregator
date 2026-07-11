/**
 * Generates Tailwind border and shadow hover classes based on Impact level.
 */
export function getImpactHoverBorder(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL": return "hover:border-red-500/30 hover:shadow-red-500/5";
    case "HIGH": return "hover:border-orange-500/30 hover:shadow-orange-500/5";
    case "MEDIUM": return "hover:border-blue-500/30 hover:shadow-blue-500/5";
    case "LOW": return "hover:border-emerald-500/30 hover:shadow-emerald-500/5";
    default: return "hover:border-primary/20 hover:shadow-lg";
  }
}

/**
 * Generates Tailwind classes for a background hover gradient based on Impact color.
 */
export function getImpactHoverGradient(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL": return "from-red-500/10 via-red-500/5 to-transparent";
    case "HIGH": return "from-orange-500/10 via-orange-500/5 to-transparent";
    case "MEDIUM": return "from-blue-500/10 via-blue-500/5 to-transparent";
    case "LOW": return "from-emerald-500/10 via-emerald-500/5 to-transparent";
    default: return "from-primary/5 via-transparent to-transparent";
  }
}

/**
 * Generates Tailwind text color classes for group-hover interactions.
 */
export function getImpactHoverText(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL": return "group-hover:text-red-500";
    case "HIGH": return "group-hover:text-orange-500";
    case "MEDIUM": return "group-hover:text-blue-500";
    case "LOW": return "group-hover:text-emerald-500";
    default: return "group-hover:text-primary";
  }
}

/**
 * Generates a static Tailwind text color class based on Impact level (e.g. for active states).
 */
export function getImpactTextColor(impact?: string | null): string {
  switch (impact?.toUpperCase()) {
    case "CRITICAL": return "text-red-500";
    case "HIGH": return "text-orange-500";
    case "MEDIUM": return "text-blue-500";
    case "LOW": return "text-emerald-500";
    default: return "text-primary";
  }
}
