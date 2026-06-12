"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CategoryBarChartProps {
  data: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const chartData = data.slice(0, 8); // Top 8

  if (!mounted) {
    return <div className="h-75 w-full" />;
  }

  return (
    <div className="h-75 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="rgba(255,255,255,0.05)"
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
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
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                      {item.name}
                    </p>
                    <p className="text-lg font-black font-mono tracking-tighter">
                      {item.count.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">
                      Articles ({item.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]} 
            barSize={16}
            onClick={(data) => router.push(`/?category=${data.name}`)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="var(--primary)"
                fillOpacity={0.4 + 0.6 * (1 - index / chartData.length)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
