"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Filter, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import FilterDropdown from "@/components/Feed/filters/FilterDropdown";

export default function FilterPopover() {
  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs font-semibold rounded-xl"
          >
            <HugeiconsIcon icon={Filter} className="w-3.5 h-3.5" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 rounded-2xl" align="end">
          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Event Region */}
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help w-fit">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Event Region
                    </h4>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[220px]"
                >
                  <p className="text-xs">
                    The geographic focus or subject of the article (extracted by AI).
                  </p>
                </TooltipContent>
              </Tooltip>
              <FilterDropdown
                label="Region"
                paramKey="region"
                options={[
                  { label: "North America", value: "North America" },
                  { label: "Europe", value: "Europe" },
                  { label: "Middle East", value: "Middle East" },
                  { label: "Asia-Pacific", value: "Asia-Pacific" },
                  { label: "South America", value: "South America" },
                  { label: "Africa", value: "Africa" },
                  { label: "Global", value: "Global" },
                ]}
              />
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help w-fit">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Source Type
                    </h4>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[220px]"
                >
                  <p className="text-xs">
                    The editorial/business model of the publisher (e.g., State Media, Commercial Publisher).
                  </p>
                </TooltipContent>
              </Tooltip>
              <FilterDropdown
                label="Type"
                paramKey="type"
                options={[
                  { label: "State Media", value: "State Media" },
                  { label: "Independent Wire", value: "Independent Wire" },
                  {
                    label: "Commercial Publisher",
                    value: "Commercial Publisher",
                  },
                  { label: "Other", value: "Other" },
                ]}
              />
            </div>

            {/* Bias Leaning */}
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help w-fit">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Bias Leaning
                    </h4>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[220px]"
                >
                  <p className="text-xs">
                    The political leaning or affiliation of the publisher (Centrist, Left/Right-leaning, State-Controlled).
                  </p>
                </TooltipContent>
              </Tooltip>
              <FilterDropdown
                label="Bias"
                paramKey="bias"
                options={[
                  { label: "Left-leaning", value: "Left-leaning" },
                  { label: "Centrist", value: "Centrist" },
                  { label: "Right-leaning", value: "Right-leaning" },
                  { label: "State-Aligned", value: "State-Aligned" },
                  { label: "State-Controlled", value: "State-Controlled" },
                  { label: "Other", value: "Other" },
                ]}
              />
            </div>

            {/* Coverage Scope */}
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help w-fit">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Coverage Scope
                    </h4>
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[220px]"
                >
                  <p className="text-xs">
                    The scope of coverage handled by the publisher (Global, Regional, National, Local).
                  </p>
                </TooltipContent>
              </Tooltip>
              <FilterDropdown
                label="Scope"
                paramKey="scope"
                options={[
                  { label: "Global", value: "Global" },
                  { label: "Regional", value: "Regional" },
                  { label: "National", value: "National" },
                  { label: "Local", value: "Local" },
                ]}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
