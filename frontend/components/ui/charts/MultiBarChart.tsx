"use client";

import { useState, useEffect } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MultiBarChartProps {
  data: any[];
  xAxisKey?: string;
  series: {
    dataKey: string;
    label: string;
    color: string;
  }[];
}

export function MultiBarChart({
  data,
  xAxisKey = "date",
  series,
}: MultiBarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barGap={4}
        >
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
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                      {item[xAxisKey]}
                    </p>
                    <div className="space-y-1">
                      {series.map((s) => (
                        <div
                          key={s.dataKey}
                          className="flex items-center justify-between gap-4"
                        >
                          <span
                            className="text-[10px] uppercase font-bold"
                            style={{ color: s.color }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="text-sm font-black font-mono"
                            style={{ color: s.color }}
                          >
                            {item[s.dataKey]?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{
              fontSize: "9px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              paddingBottom: "10px",
            }}
          />
          {series.map((s) => (
            <Bar
              key={s.dataKey}
              name={s.label}
              dataKey={s.dataKey}
              fill={s.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
