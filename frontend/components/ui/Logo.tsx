import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  textClassName?: string;
}

export default function Logo({
  className,
  showText = true,
  size = "md",
  textClassName,
}: LogoProps) {
  const iconSizeClasses = {
    sm: "w-5 h-6",
    md: "w-6 h-7",
    lg: "w-8 h-9",
  };

  const textSizeClasses = {
    sm: "text-lg tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl tracking-tight",
  };

  return (
    <div
      className={cn("flex items-center gap-1.5 group select-none cursor-pointer", className)}
    >
      {/* Standing half-open portrait book icon */}
      <div className={cn("relative shrink-0 flex items-center justify-center text-primary", iconSizeClasses[size])}>
        <svg
          viewBox="0 0 24 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full transition-transform duration-200 group-hover:scale-105"
        >
          {/* Left standing spine line */}
          <line x1="6" y1="5.5" x2="6" y2="21.5" />
          
          {/* Back open cover (slender portrait depth) */}
          <polyline points="6,5.5 13.5,3 13.5,19 6,21.5" />
          
          {/* Front open cover with bottom-right fold tail */}
          <polyline points="6,5.5 18.5,8 18.5,25 14,22.5 6,21.5" />
        </svg>
      </div>

      {showText && (
        <span
          className={cn(
            "font-extrabold font-sans tracking-tight text-foreground transition-colors",
            textSizeClasses[size],
            textClassName,
          )}
        >
          informnt<span className="text-primary font-black">.</span>
        </span>
      )}
    </div>
  );
}
