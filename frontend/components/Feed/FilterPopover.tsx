"use client";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Filter, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import FilterDropdown from "./FilterDropdown";

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
        <PopoverContent className="w-fit p-4 rounded-2xl" align="end">
          <div className="flex justify-between items-center gap-5 py-2">
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
                  { label: "Latin America", value: "Latin America" },
                  { label: "Africa", value: "Africa" },
                  { label: "Global", value: "Global" },
                ]}
              />
            </div>
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
                    The editorial/business model of the publisher (e.g., State
                    Media, Commercial Publisher).
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
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
