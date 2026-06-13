"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BiasDonutChartProps {
  data: {
    label: string;
    count: number;
    color: string;
    percentage: number;
  }[];
  filterParam?: "bias" | "scope" | "region" | "perspective";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percentage,
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 10}
        dy={8}
        textAnchor="middle"
        fill={fill}
        className="text-[10px] font-black uppercase tracking-widest"
      >
        {payload.label}
      </text>
      <text
        x={cx}
        y={cy + 15}
        dy={8}
        textAnchor="middle"
        fill="#fff"
        className="text-xl font-black font-mono tracking-tighter"
      >
        {percentage}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 8}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export function BiasDonutChart({ data, filterParam = "perspective" }: BiasDonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-60 w-full" />;
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <PieChart>
          <Pie
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            dataKey="count"
            stroke="none"
            onClick={(data: any) => {
              const label = data.payload?.label || data.label || "";
              router.push(`/?${filterParam}=${encodeURIComponent(label)}`);
            }}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ filter: `drop-shadow(0 0 8px ${entry.color}40)` }}
              />
            ))}
          </Pie>
          <Tooltip
            defaultIndex={0}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return null; // Using activeShape instead
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
