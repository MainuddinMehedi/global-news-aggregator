"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FilterDropdownProps {
  label: string;
  paramKey: string;
  options: { label: string; value: string }[];
  showLabel?: boolean;
}

export default function FilterDropdown({ label, paramKey, options, showLabel = false }: FilterDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramKey) ?? "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(paramKey);
    } else {
      params.set(paramKey, value);
    }
    // Reset cursor when filter changes
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={`flex items-center ${showLabel ? 'space-x-3' : 'space-x-1'}`}>
      {showLabel && (
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest w-16">
          {label}:
        </span>
      )}
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className={showLabel ? "w-[140px] h-8 text-xs" : "w-[115px] h-8 text-xs"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
