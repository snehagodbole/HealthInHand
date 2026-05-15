"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { fastingPlans, getPlanByLabel } from "@/lib/fastingUtils";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("16:8");
  const [customFast, setCustomFast] = useState(16);
  const [customEat, setCustomEat] = useState(8);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before onboarding."
      );
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      setUserId(data.user.id);
      setLoading(false);
    });
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      return;
    }

    setSaving(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before saving your plan."
      );
      setSaving(false);
      return;
    }

    const plan = getPlanByLabel(selectedPlan);
    const fastingHours = selectedPlan === "Custom" ? customFast : plan.fastingHours;
    const eatingHours = selectedPlan === "Custom" ? customEat : plan.eatingHours;

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      fasting_plan: selectedPlan,
      fasting_hours_goal: fastingHours,
      eating_hours_goal: eatingHours
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="page-shell py-12">
        <div className="hero-glass p-8 text-center text-stone-500">Loading...</div>
      </main>
    );
  }

  return (
    <main className="page-shell py-12">
      <section className="mx-auto max-w-3xl">
        <div className="page-header-fancy">
          <p className="text-sm font-semibold uppercase text-moss-600">
            Onboarding
          </p>
          <h1 className="mt-2 text-4xl font-bold text-ink">Choose a fasting plan</h1>
          <p className="mt-4 max-w-2xl leading-7 text-stone-600">
            Pick the schedule you want HealthInHand to use for your dashboard goal.
            You can change this later by returning to onboarding.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {fastingPlans.map((plan) => (
              <label
                key={plan.label}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  selectedPlan === plan.label
                    ? "border-moss-600 bg-moss-50"
                    : "border-white/75 bg-white/80 hover:border-moss-100"
                }`}
              >
                <input
                  type="radio"
                  name="fasting-plan"
                  value={plan.label}
                  checked={selectedPlan === plan.label}
                  onChange={() => setSelectedPlan(plan.label)}
                  className="sr-only"
                />
                <span className="block text-lg font-bold text-ink">{plan.label}</span>
                <span className="mt-1 block text-sm text-stone-500">
                  {plan.fastingHours}h fast / {plan.eatingHours}h eat
                </span>
              </label>
            ))}
          </div>

          {selectedPlan === "Custom" && (
            <div className="hero-glass grid gap-4 p-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Fasting hours
                </span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={23}
                  value={customFast}
                  onChange={(event) => setCustomFast(Number(event.target.value))}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Eating hours
                </span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={23}
                  value={customEat}
                  onChange={(event) => setCustomEat(Number(event.target.value))}
                  required
                />
              </label>
            </div>
          )}

          {message && (
            <p className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
              {message}
            </p>
          )}

          <button type="submit" disabled={saving} className="button-primary">
            {saving ? "Saving..." : "Save plan"}
          </button>
        </form>
      </section>
    </main>
  );
}
