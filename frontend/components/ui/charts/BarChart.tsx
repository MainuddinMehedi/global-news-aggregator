"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

interface BarChartProps {
  data: {
    label: string;
    count: number;
    percentage?: number;
    color?: string;
  }[];
  layout?: "horizontal" | "vertical";
  maxItems?: number;
  onItemClick?: (label: string) => void;
}

export function BarChart({
  data,
  layout = "vertical",
  maxItems,
  onItemClick,
}: BarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const chartData = maxItems ? data.slice(0, maxItems) : data;

  if (!mounted) {
    return <div className="h-full w-full min-h-[200px]" />;
  }

  const isVertical = layout === "vertical";

  return (
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <RechartsBarChart
          layout={layout}
          data={chartData}
          margin={
            isVertical
              ? { top: 10, right: 60, left: 0, bottom: 0 }
              : { top: 20, right: 0, left: -20, bottom: 0 }
          }
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={!isVertical}
            vertical={isVertical}
            stroke="rgba(255,255,255,0.05)"
          />

          {isVertical ? (
            <>
              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "rgba(255,255,255,0.6)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
              />
            </>
          )}

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;

                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                      {item.label}
                    </p>
                    <p className="text-lg font-black font-mono tracking-tighter">
                      {item.count.toLocaleString()}
                    </p>
                    {item.percentage !== undefined && (
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        Share ({item.percentage}%)
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            barSize={16}
            onClick={(data: any) => {
              if (onItemClick) {
                const label = data.payload?.label || data.label || "";
                if (label) onItemClick(label);
              }
            }}
            className={onItemClick ? "cursor-pointer" : ""}
          >
            {chartData.map((entry, index) => {
              // Use provided color, or default to a faded primary color for vertical lists
              const defaultFill = isVertical
                ? "var(--primary)"
                : "var(--primary)";

              const fillOpacity =
                entry.color || !isVertical
                  ? 1
                  : 0.4 + 0.6 * (1 - index / chartData.length);

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || defaultFill}
                  fillOpacity={fillOpacity}
                />
              );
            })}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
