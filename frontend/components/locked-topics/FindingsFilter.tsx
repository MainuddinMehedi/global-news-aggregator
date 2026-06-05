"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { SourceConfig } from "@/types/lockedTopic";

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "relevance", label: "Highest Relevance" },
];

export default function FindingsFilter({
  currentSource,
  currentSort,
  sources,
}: {
  currentSource: string;
  currentSort: string;
  sources: SourceConfig[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Generate dynamic source tabs based on tracker sources
  const sourceTabs = [{ value: "ALL", label: "All Sources" }];

  const hasInternal = sources.some((s) => s.type === "internal_db");
  const hasGoogle = sources.some((s) => s.type === "google_news");
  const hasBrave = sources.some((s) => s.type === "brave");
  const hasReddit = sources.some((s) => s.type === "reddit");

  if (hasInternal) sourceTabs.push({ value: "ARTICLE", label: "Internal DB" });
  if (hasGoogle) sourceTabs.push({ value: "GOOGLE", label: "Google News" });
  if (hasBrave) sourceTabs.push({ value: "BRAVE", label: "Brave Search" });
  if (hasReddit) sourceTabs.push({ value: "REDDIT", label: "Reddit" });

  const hasOtherSources = sources.some(
    (s) => !["internal_db", "google_news", "brave", "reddit"].includes(s.type),
  );

  if (hasOtherSources) {
    sourceTabs.push({ value: "OTHER", label: "Others" });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-y border-secondary/50">
      <div className="flex flex-wrap gap-2">
        {sourceTabs.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam("source", s.value)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              currentSource === s.value
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          Sequence
        </span>
        <Select
          value={currentSort}
          onValueChange={(v) => updateParam("sort", v)}
        >
          <SelectTrigger className="w-[180px] rounded-xl border-secondary bg-background/50 h-10 text-[11px] font-bold uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-secondary shadow-2xl backdrop-blur-xl">
            {SORTS.map((s) => (
              <SelectItem
                key={s.value}
                value={s.value}
                className="text-xs font-bold uppercase tracking-wider py-3"
              >
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
