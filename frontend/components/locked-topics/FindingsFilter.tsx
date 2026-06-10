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
  counts = {},
}: {
  currentSource: string;
  currentSort: string;
  sources: SourceConfig[];
  counts?: Record<string, number>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Maps each source config type to its corresponding FindingSource and display label
  const sourceTypeToTab: Record<string, { value: string; label: string }> = {
    internal_db: { value: "ARTICLE", label: "Internal DB" },
    google_news: { value: "GOOGLE", label: "Google News" },
    brave: { value: "BRAVE", label: "Brave Search" },
    reddit: { value: "REDDIT", label: "Reddit" },
    github: { value: "GITHUB", label: "GitHub" },
    youtube: { value: "RSS", label: "YouTube" },
    webpage: { value: "WEBPAGE", label: "Webpage" },
    scrape: { value: "SCRAPE", label: "Scrape" },
    bd_gov_jobs: { value: "BD_GOV_JOBS", label: "BD Gov Jobs" },
    company_careers: { value: "COMPANY_CAREERS", label: "Company Careers" },
    search: { value: "SEARCH", label: "Web Search" },
  };

  // Generate tabs dynamically from enabled sources
  const sourceTabs = [{ value: "ALL", label: "All Sources" }];
  const addedTabs = new Set<string>();

  for (const source of sources) {
    const tab = sourceTypeToTab[source.type];
    if (tab && !addedTabs.has(tab.value)) {
      sourceTabs.push(tab);
      addedTabs.add(tab.value);
    }
  }

  // Any source type not in the mapping falls under "Others"
  const hasUnmappedSource = sources.some((s) => !sourceTypeToTab[s.type]);
  if (hasUnmappedSource) {
    sourceTabs.push({ value: "OTHER", label: "Others" });
  }

  return (
    <div className="flex flex-col gap-4 py-6 border-y border-secondary/50">
      <div className="flex overflow-x-auto sm:flex-wrap gap-2 no-scrollbar pb-1">
        {sourceTabs.map((s) => {
          const count = counts[s.value] || 0;
          return (
            <button
              key={s.value}
              onClick={() => updateParam("source", s.value)}
              className={`shrink-0 px-3 sm:px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
                currentSource === s.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <span className="whitespace-nowrap">{s.label}</span>
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[16px] ${
                  currentSource === s.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-foreground/10 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 self-end">
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
