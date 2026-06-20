"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

interface PipelineVolumeChartProps {
  chartData: any[];
}

export default function PipelineVolumeChart({ chartData }: PipelineVolumeChartProps) {
  return (
    <Card className="bg-card/35 backdrop-blur-sm border-border/50 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-foreground font-semibold">
            Volume & Output Flow
          </h3>
          <p className="text-xs text-muted-foreground">
            Ingestion rates overlayed with processed and clustered metrics. Shows system throughput over time.
          </p>
        </div>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: "0.75rem",
                  color: "hsl(var(--popover-foreground))",
                }}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="raw"
                name="Raw Fetched Articles"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="processed"
                name="AI Processed Articles"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="clustered"
                name="Story Clusters Formed"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
