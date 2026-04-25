"use client";

import { Info } from "lucide-react";

// Static data for now — will be driven by API later
const sourcePerspectives = [
  { name: "Al Jazeera", articles: 142, color: "bg-emerald-500" },
  { name: "TASS", articles: 98, color: "bg-red-500" },
  { name: "BBC News", articles: 156, color: "bg-blue-500" },
  { name: "Reuters", articles: 210, color: "bg-orange-500" },
  { name: "Xinhua", articles: 85, color: "bg-red-700" },
];

const biasDistribution = [
  { label: "Western", pct: "40%", color: "bg-blue-500" },
  { label: "Non-Western", pct: "30%", color: "bg-emerald-500" },
  { label: "Eastern", pct: "20%", color: "bg-red-500" },
  { label: "Wire", pct: "10%", color: "bg-zinc-500" },
];

export function RightPanel() {
  return (
    <aside className="w-72 border-l border-border bg-card hidden xl:flex flex-col">
      {/* Source Perspectives */}
      <div className="p-5 border-b border-border">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
          Source Perspective
        </h3>
        <div className="space-y-3">
          {sourcePerspectives.map((src) => (
            <div
              key={src.name}
              className="flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${src.color}`} />
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100">
                  {src.name}
                </span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">
                {src.articles}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bias Distribution */}
      <div className="p-5 flex-1 overflow-y-auto scrollbar-hide">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
          Bias Distribution
        </h3>

        {/* Donut Chart */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#27272a"
              strokeWidth="4"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray="40, 100"
              strokeDashoffset="0"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray="30, 100"
              strokeDashoffset="-40"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeDasharray="20, 100"
              strokeDashoffset="-70"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-zinc-100">12</span>
            <span className="text-[10px] text-zinc-500">Sources</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          {biasDistribution.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-zinc-400"
            >
              <span className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${item.color} mr-2`} />
                {item.label}
              </span>
              <span>{item.pct}</span>
            </div>
          ))}
        </div>

        {/* Diversity Score */}
        <div className="mt-8 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-300">
              Diversity Score
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Your current feed covers 4 distinct geopolitical perspectives.
            Balanced coverage detected for active stories.
          </p>
        </div>
      </div>
    </aside>
  );
}
