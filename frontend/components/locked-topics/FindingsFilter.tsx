"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

const SOURCES = [
  { value: "ALL", label: "All Sources" },
  { value: "ARTICLE", label: "Internal DB" },
  { value: "GOOGLE", label: "Google News" },
  { value: "BRAVE", label: "Brave Search" },
  { value: "REDDIT", label: "Reddit" },
];

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "relevance", label: "Highest Relevance" },
];

export default function FindingsFilter({
  currentSource,
  currentSort,
}: {
  currentSource: string;
  currentSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-y border-secondary/50">
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
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
