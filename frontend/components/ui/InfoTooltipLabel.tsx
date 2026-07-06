import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";

interface InfoTooltipLabelProps {
  label: string;
  tooltipText: React.ReactNode;
}

export function InfoTooltipLabel({
  label,
  tooltipText,
}: InfoTooltipLabelProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help w-fit">
          <span className="text-xs font-semibold">{label}</span>
          <HugeiconsIcon
            icon={InformationCircleIcon}
            className="w-3.5 h-3.5 text-muted-foreground"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-[220px]">
        <p className="text-xs">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
