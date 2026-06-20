"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AiUsageDataPoint } from "@/queries/admin/ai";

interface AiUsageChartsProps {
  usageTimeline: AiUsageDataPoint[];
}

export default function AiUsageCharts({ usageTimeline }: AiUsageChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 h-96 animate-pulse" />
        <div className="bg-card border border-border/50 rounded-2xl p-6 h-96 animate-pulse" />
      </div>
    );
  }

  // Process data for Recharts
  const days = 30;
  const chartDataMap: Record<
    string,
    {
      date: string;
      mistralTokens: number;
      groqTokens: number;
      totalTokens: number;
      cost: number;
    }
  > = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    chartDataMap[d] = {
      date: d,
      mistralTokens: 0,
      groqTokens: 0,
      totalTokens: 0,
      cost: 0,
    };
  }

  usageTimeline.forEach((item) => {
    const d = item.date;
    if (chartDataMap[d]) {
      const tokens = item.tokensUsed;
      const cost = item.estimatedCost;
      const provider = item.provider.toLowerCase();
      if (provider.includes("mistral")) {
        chartDataMap[d].mistralTokens += tokens;
      } else {
        chartDataMap[d].groqTokens += tokens;
      }
      chartDataMap[d].totalTokens += tokens;
      chartDataMap[d].cost += cost;
    }
  });

  const sortedPoints = Object.values(chartDataMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let runningCost = 0;
  const processedData = sortedPoints.map((point) => {
    runningCost += point.cost;
    return {
      ...point,
      cumulativeCost: runningCost,
      dateFormatted: point.date.split("-").slice(1).join("/"), // MM/DD
    };
  });

  const totalPeriodTokens = processedData.reduce((acc, curr) => acc + curr.totalTokens, 0);
  const totalPeriodCost = runningCost;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Token Consumption */}
      <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-foreground">Token Utilization Breakdown</h3>
            <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {(totalPeriodTokens / 1000000).toFixed(2)}M Tokens
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Tokens utilized over the last 30 days split by AI provider.
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMistral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGroq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="dateFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 border border-border/50 backdrop-blur-md px-3 py-2.5 rounded-xl shadow-xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {data.date}
                        </p>
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            Mistral:
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {(data.mistralTokens / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-sky-400">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            Groq:
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {(data.groqTokens / 1000).toFixed(1)}k
                          </span>
                        </div>
                        <div className="border-t border-border/50 my-1 pt-1 flex items-center justify-between gap-4 text-xs font-bold">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-mono text-foreground">
                            {(data.totalTokens / 1000).toFixed(1)}k
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              <Area
                type="monotone"
                dataKey="mistralTokens"
                name="Mistral"
                stroke="#c084fc"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMistral)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="groqTokens"
                name="Groq (Fallback)"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGroq)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Cumulative Expense */}
      <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-foreground">Cumulative Expenses Projection</h3>
            <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
              ${totalPeriodCost.toFixed(2)} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Accrued API tokens cost curve over the last 30 days.
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--emerald-500, #10b981)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--emerald-500, #10b981)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="dateFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickFormatter={(val) => `$${val.toFixed(2)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 border border-border/50 backdrop-blur-md px-3 py-2.5 rounded-xl shadow-xl space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {data.date}
                        </p>
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-muted-foreground">Daily Cost:</span>
                          <span className="font-mono font-bold text-foreground">
                            ${data.cost.toFixed(4)}
                          </span>
                        </div>
                        <div className="border-t border-border/50 my-1 pt-1 flex items-center justify-between gap-4 text-xs font-bold">
                          <span className="text-emerald-500">Accrued Cost:</span>
                          <span className="font-mono text-emerald-500">
                            ${data.cumulativeCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulativeCost"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
