"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type ChartDatum = {
  day: string;
  hours: number;
};

type ProgressChartProps = {
  data: ChartDatum[];
};

export default function ProgressChart({ data }: ProgressChartProps) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <div className="card p-5">
      <div className="mb-5">
        <p className="text-sm font-medium text-stone-500">This week</p>
        <h2 className="text-2xl font-bold text-ink">Fasting hours</h2>
      </div>
      <div className="h-72 w-full">
        {chartReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7efe5" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" width={34} />
              <Tooltip
                cursor={{ fill: "rgba(91, 140, 100, 0.08)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #dcebdd",
                  boxShadow: "0 12px 30px rgba(32, 48, 42, 0.1)"
                }}
              />
              <Bar dataKey="hours" fill="#5b8c64" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-lg bg-moss-50/40" />
        )}
      </div>
    </div>
  );
}
