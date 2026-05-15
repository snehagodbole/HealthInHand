"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

type WeightInputProps = {
  userId: string;
  latestWeight?: number | null;
  latestUnit?: "lb" | "kg";
};

export default function WeightInput({
  userId,
  latestWeight,
  latestUnit = "lb"
}: WeightInputProps) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"lb" | "kg">(latestUnit);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before logging weight."
      );
      setLoading(false);
      return;
    }

    const parsed = parseFloat(weight);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setMessage("Enter a valid weight greater than 0.");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("weight_measurements").insert({
      user_id: userId,
      weight: parsed,
      unit,
      measured_at: new Date().toISOString()
    });

    if (error) {
      setMessage(error.message);
    } else {
      setWeight("");
      setMessage(null);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-moss-50 text-moss-700">
          <Scale size={21} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Log Weight</h2>
          {latestWeight != null && (
            <p className="text-sm text-stone-500">
              Last: {latestWeight} {latestUnit}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0.1"
            placeholder={latestWeight != null ? `${latestWeight}` : "e.g. 165"}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={loading}
            required
          />
          <select
            className="input w-auto"
            value={unit}
            onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
            disabled={loading}
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="button-primary min-h-12 whitespace-nowrap"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
          {message}
        </p>
      )}
    </div>
  );
}
