"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Filter } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import FilterDropdown from "./FilterDropdown";

export default function FilterPopover() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
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
              <PopoverContent className="w-[200px] p-3 rounded-2xl" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Source Origin
                    </h4>
                    <FilterDropdown
                      label="Origin"
                      paramKey="origin"
                      options={[
                        { label: "North American", value: "North America" },
                        { label: "European", value: "Europe" },
                        { label: "Middle Eastern", value: "Middle East" },
                        { label: "Asia-Pacific", value: "Asia-Pacific" },
                        { label: "Global", value: "Global" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Source Type
                    </h4>
                    <FilterDropdown
                      label="Type"
                      paramKey="type"
                      options={[
                        { label: "State Media", value: "State Media" },
                        { label: "Independent Wire", value: "Independent Wire" },
                        { label: "Commercial Publisher", value: "Commercial Publisher" },
                        { label: "Other", value: "Other" },
                      ]}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Filter news by publisher type and location.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
