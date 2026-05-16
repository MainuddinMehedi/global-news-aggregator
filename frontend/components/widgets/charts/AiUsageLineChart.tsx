"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

interface AiUsageLineChartProps {
  data: {
    date: string;
    tokensUsed: number;
    estimatedCost: number;
  }[];
}

export function AiUsageLineChart({ data }: AiUsageLineChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[200px] w-full" />;
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(255,255,255,0.4)",
              fontSize: 9,
              fontWeight: 700,
            }}
            tickFormatter={(val) => val.split("-").slice(1).join("/")}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                      {item.date}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-black font-mono tracking-tighter text-foreground">
                        {(item.tokensUsed / 1000).toFixed(1)}k
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        Tokens
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-black font-mono tracking-tighter text-emerald-500">
                        ${item.estimatedCost.toFixed(4)}
                      </p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        Cost
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="tokensUsed"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTokens)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
