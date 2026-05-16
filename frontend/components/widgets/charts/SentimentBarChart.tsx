"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SentimentBarChartProps {
  data: {
    label: string;
    count: number;
  }[];
}

const COLORS: Record<string, string> = {
  "Very Negative": "#ef4444",
  "Negative": "#f97316",
  "Neutral": "#6b7280",
  "Positive": "#84cc16",
  "Very Positive": "#10b981",
};

export function SentimentBarChart({ data }: SentimentBarChartProps) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700 }}
            interval={0}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: COLORS[item.label] }}>
                      {item.label}
                    </p>
                    <p className="text-lg font-black font-mono tracking-tighter">
                      {item.count.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">
                      Articles
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            barSize={40}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.label] ?? "#6b7280"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
