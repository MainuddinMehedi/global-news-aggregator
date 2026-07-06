import FilterDropdown from "@/components/Feed/filters/FilterDropdown";
import { Button } from "@/components/ui/button";
import { InfoTooltipLabel } from "@/components/ui/InfoTooltipLabel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Filter } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Suspense } from "react";

export default function FilterPopover({
  defaultRegion = "all",
}: {
  defaultRegion?: string;
}) {
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
              <InfoTooltipLabel
                label="Event Region"
                tooltipText="The geographic focus or subject of the article (extracted by AI)."
              />
              <Suspense
                fallback={
                  <div className="w-[115px] h-8 bg-muted animate-pulse rounded-md" />
                }
              >
                <FilterDropdown
                  label="Region"
                  paramKey="region"
                  defaultValue={defaultRegion}
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
              </Suspense>
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <InfoTooltipLabel
                label="Source Type"
                tooltipText="The editorial/business model of the publisher (e.g., State Media, Commercial Publisher)."
              />
              <Suspense
                fallback={
                  <div className="w-[115px] h-8 bg-muted animate-pulse rounded-md" />
                }
              >
                <FilterDropdown
                  label="Type"
                  paramKey="type"
                  options={[
                    { label: "Commercial", value: "Commercial" },
                    { label: "State Media", value: "State Media" },
                    { label: "Independent", value: "Independent" },
                    {
                      label: "Academic/Think Tank",
                      value: "Academic/Think Tank",
                    },
                    { label: "Gov/Official", value: "Gov/Official" },
                    { label: "Press Release", value: "Press Release" },
                  ]}
                />
              </Suspense>
            </div>

            {/* Bias Leaning */}
            <div className="space-y-2">
              <InfoTooltipLabel
                label="Bias Leaning"
                tooltipText="The political leaning or affiliation of the publisher (Centrist, Left/Right-leaning, State-Controlled)."
              />
              <Suspense
                fallback={
                  <div className="w-[115px] h-8 bg-muted animate-pulse rounded-md" />
                }
              >
                <FilterDropdown
                  label="Bias"
                  paramKey="bias"
                  options={[
                    { label: "Centrist", value: "Centrist" },
                    { label: "Left-leaning", value: "Left-leaning" },
                    { label: "Right-leaning", value: "Right-leaning" },
                    { label: "State-Controlled", value: "State-Controlled" },
                    {
                      label: "Independent/Neutral",
                      value: "Independent/Neutral",
                    },
                  ]}
                />
              </Suspense>
            </div>

            {/* Coverage Scope */}
            <div className="space-y-2">
              <InfoTooltipLabel
                label="Coverage Scope"
                tooltipText="The scope of coverage handled by the publisher (Global, Regional, National, Local)."
              />
              <Suspense
                fallback={
                  <div className="w-[115px] h-8 bg-muted animate-pulse rounded-md" />
                }
              >
                <FilterDropdown
                  label="Scope"
                  paramKey="scope"
                  options={[
                    { label: "Global", value: "Global" },
                    { label: "Regional", value: "Regional" },
                    { label: "National", value: "National" },
                    { label: "Local", value: "Local" },
                    { label: "Specialized", value: "Specialized" },
                  ]}
                />
              </Suspense>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
