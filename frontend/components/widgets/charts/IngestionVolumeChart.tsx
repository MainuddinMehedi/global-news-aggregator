"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface IngestionVolumeChartProps {
  data: {
    date: string;
    raw: number;
    processed: number;
  }[];
}

export function IngestionVolumeChart({ data }: IngestionVolumeChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-background/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                      {item.date}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">
                          Raw Fetches
                        </span>
                        <span className="text-sm font-black font-mono text-foreground">
                          {item.raw}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] text-emerald-500 uppercase font-bold">
                          Processed
                        </span>
                        <span className="text-sm font-black font-mono text-emerald-500">
                          {item.processed}
                        </span>
                      </div>
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
          <Bar
            name="Raw"
            dataKey="raw"
            fill="rgba(255,255,255,0.1)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            name="Processed"
            dataKey="processed"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
