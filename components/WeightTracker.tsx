"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Scale, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { WeightMeasurement } from "@/types/database";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

type WeightTrackerProps = {
  userId: string;
  measurements: WeightMeasurement[];
};

type WeightTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number | string;
    payload?: {
      unit?: "lb" | "kg";
    };
  }>;
};

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatWeight(value: number, unit: "lb" | "kg") {
  return `${Number(value).toFixed(1)} ${unit}`;
}

function WeightTooltip({
  active,
  payload,
  label
}: WeightTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const entry = payload[0];
  const unit = entry.payload?.unit ?? "lb";

  return (
    <div className="rounded-lg border border-moss-100 bg-white px-3 py-2 text-sm shadow-soft">
      <p className="font-medium text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">
        {formatWeight(Number(entry.value), unit)}
      </p>
    </div>
  );
}

export default function WeightTracker({
  userId,
  measurements
}: WeightTrackerProps) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [measuredAt, setMeasuredAt] = useState(() =>
    toDateTimeLocalValue(new Date())
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sortedMeasurements = useMemo(
    () =>
      [...measurements].sort(
        (first, second) =>
          new Date(first.measured_at).getTime() -
          new Date(second.measured_at).getTime()
      ),
    [measurements]
  );

  const latest = sortedMeasurements[sortedMeasurements.length - 1];
  const previous = sortedMeasurements[sortedMeasurements.length - 2];
  const latestUnit = latest?.unit ?? unit;
  const change =
    latest && previous && latest.unit === previous.unit
      ? Number(latest.weight) - Number(previous.weight)
      : null;

  const chartData = sortedMeasurements.map((measurement) => ({
    label: new Date(measurement.measured_at).toLocaleDateString([], {
      month: "short",
      day: "numeric"
    }),
    weight: Number(measurement.weight),
    unit: measurement.unit
  }));

  const saveMeasurement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before saving weight."
      );
      setLoading(false);
      return;
    }

    const parsedWeight = Number(weight);
    const selectedTime = new Date(measuredAt);

    if (!parsedWeight || parsedWeight <= 0) {
      setMessage("Enter a valid weight.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(selectedTime.getTime())) {
      setMessage("Choose a valid measurement time.");
      setLoading(false);
      return;
    }

    if (selectedTime > new Date()) {
      setMessage("Measurement time cannot be in the future.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("weight_measurements").insert({
      user_id: userId,
      weight: Number(parsedWeight.toFixed(1)),
      unit,
      measured_at: selectedTime.toISOString()
    });

    if (error) {
      setMessage(error.message);
    } else {
      setWeight("");
      setMeasuredAt(toDateTimeLocalValue(new Date()));
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-moss-600">
            Weight
          </p>
          <h2 className="mt-2 text-3xl font-bold text-ink">
            Weight fluctuation
          </h2>
        </div>
        <div className="grid gap-2 text-sm text-stone-500 sm:text-right">
          <span>
            Latest:{" "}
            <strong className="text-ink">
              {latest ? formatWeight(Number(latest.weight), latest.unit) : "--"}
            </strong>
          </span>
          <span>
            Change:{" "}
            <strong className="text-ink">
              {change === null
                ? "--"
                : `${change > 0 ? "+" : ""}${change.toFixed(1)} ${latestUnit}`}
            </strong>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <form onSubmit={saveMeasurement} className="card p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">Log entry</p>
              <h3 className="text-2xl font-bold text-ink">Add weight</h3>
            </div>
            <div className="grid size-11 place-items-center rounded-lg bg-coral-50 text-coral-600">
              <Scale size={23} aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Weight
              </span>
              <div className="grid grid-cols-[1fr_5.5rem] gap-2">
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  required
                />
                <select
                  className="input px-3"
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as "lb" | "kg")
                  }
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Measured at
              </span>
              <input
                className="input"
                type="datetime-local"
                value={measuredAt}
                max={toDateTimeLocalValue(new Date())}
                onChange={(event) => setMeasuredAt(event.target.value)}
                required
              />
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-primary mt-5 w-full"
          >
            {loading ? "Saving..." : "Save measurement"}
          </button>
        </form>

        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">Trend</p>
              <h3 className="text-2xl font-bold text-ink">Weight graph</h3>
            </div>
            <div className="grid size-11 place-items-center rounded-lg bg-moss-50 text-moss-700">
              <TrendingUp size={23} aria-hidden="true" />
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7efe5" />
                  <XAxis dataKey="label" stroke="#6b7280" />
                  <YAxis
                    stroke="#6b7280"
                    width={44}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip content={<WeightTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#e05f39"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-lg border border-dashed border-moss-100 text-center text-sm text-stone-500">
                Add your first measurement to see the graph.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
