"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Layers, DollarSign, Activity } from "lucide-react";

interface AnalyticsSummary {
  totalArticles: number;
  articlesToday: number;
  processedCount: number;
  processedPct: string;
  biasDistribution: { category: string; count: number }[];
  categories: { name: string; count: number }[];
  aiCostMonth: string;
  aiTokensMonth: number;
  aiCallsMonth: number;
  avgSentiment: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-zinc-500">
        Failed to load analytics data.
      </div>
    );
  }

  const totalBias = data.biasDistribution.reduce((s, b) => s + b.count, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h2 className="text-xl font-bold text-zinc-100">Analytics Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Articles</div>
          <div className="text-2xl font-bold text-zinc-100">
            {data.totalArticles.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{data.articlesToday} today
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Processed</div>
          <div className="text-2xl font-bold text-zinc-100">
            {data.processedCount.toLocaleString()}
          </div>
          <div className="text-xs text-blue-400 mt-1 flex items-center">
            <Layers className="w-3 h-3 mr-1" />
            {data.processedPct}% of feed
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">AI Cost (Month)</div>
          <div className="text-2xl font-bold text-zinc-100">
            ${data.aiCostMonth}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {data.aiCallsMonth} calls · {data.aiTokensMonth.toLocaleString()}{" "}
            tokens
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Avg Sentiment</div>
          <div className="text-2xl font-bold text-zinc-100">
            {data.avgSentiment}
          </div>
          <div className="text-xs text-amber-400 mt-1 flex items-center">
            <Activity className="w-3 h-3 mr-1" />
            {parseFloat(data.avgSentiment) > 0
              ? "Slightly positive"
              : parseFloat(data.avgSentiment) < 0
                ? "Slightly negative"
                : "Neutral"}
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bias Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">
            Bias Distribution
          </h3>
          <div className="h-48 flex items-end justify-between space-x-3">
            {data.biasDistribution.map((item) => {
              const pct = totalBias > 0 ? (item.count / totalBias) * 100 : 0;
              const colorMap: Record<string, string> = {
                Western: "bg-blue-500",
                Eastern: "bg-red-500",
                "Non-Western": "bg-emerald-500",
                Neutral: "bg-zinc-500",
              };
              return (
                <div
                  key={item.category}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div
                    className="w-full rounded-t-sm relative overflow-hidden group-hover:opacity-90 transition-opacity"
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  >
                    <div
                      className={`absolute bottom-0 w-full h-full ${colorMap[item.category] || "bg-zinc-600"}`}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 text-center">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-4">
            Top Categories
          </h3>
          <div className="space-y-3">
            {data.categories.map((cat) => {
              const pct =
                data.processedCount > 0
                  ? (cat.count / data.processedCount) * 100
                  : 0;
              return (
                <div key={cat.name} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-300 capitalize">{cat.name}</span>
                    <span className="text-zinc-600">
                      {cat.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
