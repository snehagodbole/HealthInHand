"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { format } from "date-fns";

type WeightDatum = {
  date: string;
  weight: number;
  unit: "lb" | "kg";
};

type WeightChartProps = {
  data: WeightDatum[];
};

export default function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="card p-5">
        <div className="mb-5">
          <p className="text-sm font-medium text-stone-500">Trends</p>
          <h2 className="text-2xl font-bold text-ink">Weight</h2>
        </div>
        <p className="py-12 text-center text-sm text-stone-400">
          No weight data yet — log your first entry above.
        </p>
      </div>
    );
  }

  const unit = data[0]?.unit ?? "lb";
  const weights = data.map((d) => d.weight);
  const min = Math.floor(Math.min(...weights) - 2);
  const max = Math.ceil(Math.max(...weights) + 2);

  const chartData = data.map((d) => ({
    label: format(new Date(d.date), "MMM d"),
    weight: d.weight
  }));

  const change = data.length >= 2 ? data[data.length - 1].weight - data[0].weight : 0;
  const changeLabel =
    change === 0
      ? "No change"
      : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}`;

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">Trends</p>
          <h2 className="text-2xl font-bold text-ink">Weight</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            change < 0
              ? "bg-moss-50 text-moss-700"
              : change > 0
                ? "bg-coral-50 text-coral-600"
                : "bg-stone-100 text-stone-600"
          }`}
        >
          {changeLabel}
        </span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5b8c64" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#5b8c64" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7efe5" />
            <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis
              stroke="#6b7280"
              domain={[min, max]}
              width={42}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #dcebdd",
                boxShadow: "0 12px 30px rgba(32, 48, 42, 0.1)"
              }}
              formatter={(value: number) => [`${value} ${unit}`, "Weight"]}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#5b8c64"
              strokeWidth={2}
              fill="url(#weightGradient)"
              dot={{ r: 3, fill: "#5b8c64" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
