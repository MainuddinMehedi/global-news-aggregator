"use client";

import { useState, useEffect } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  data: any[];
  xAxisKey?: string;
  series: {
    dataKey: string;
    color: string;
    label?: string;
    formatValue?: (val: number) => string;
  }[];
}

export function AreaChart({ data, xAxisKey = "date", series }: AreaChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-50 w-full" />;
  }

  return (
    <div className="h-50 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {series.map((s, idx) => (
              <linearGradient
                key={s.dataKey}
                id={`color-${s.dataKey}-${idx}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "rgba(255,255,255,0.4)",
              fontSize: 9,
              fontWeight: 700,
            }}
            tickFormatter={(val) => {
              if (typeof val === "string" && val.includes("-")) {
                return val.split("-").slice(1).join("/");
              }
              return val;
            }}
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                      {item[xAxisKey]}
                    </p>
                    {series.map((s, idx) => {
                      const val = item[s.dataKey];
                      const formattedVal = s.formatValue
                        ? s.formatValue(val)
                        : val.toLocaleString();
                      return (
                        <div
                          key={s.dataKey}
                          className="flex items-baseline justify-between gap-4 mb-1"
                        >
                          <p
                            className="text-[9px] uppercase font-bold"
                            style={{ color: s.color }}
                          >
                            {s.label || s.dataKey}
                          </p>
                          <p className="text-sm font-black font-mono tracking-tighter text-foreground">
                            {formattedVal}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return null;
            }}
          />
          {series.map((s, idx) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${s.dataKey}-${idx})`}
              animationDuration={1500}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
