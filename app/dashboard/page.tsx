import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Flame, Target } from "lucide-react";
import FastingControls from "@/components/FastingControls";
import StatsCard from "@/components/StatsCard";
import TimerCard from "@/components/TimerCard";
import WeightInput from "@/components/WeightInput";
import WeightChart from "@/components/WeightChart";
import { formatDuration, getPlanByLabel, getWeeklyFastingMinutes } from "@/lib/fastingUtils";
import { calculateCurrentStreak } from "@/lib/streakUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { data: activeSession },
    { data: sessions },
    { data: weightData }
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("fasting_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("fasting_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("end_time", { ascending: false }),
    supabase
      .from("weight_measurements")
      .select("*")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: true })
  ]);

  const weightMeasurements = (weightData ?? []).map((w) => ({
    date: w.measured_at,
    weight: Number(w.weight),
    unit: w.unit as "lb" | "kg"
  }));

  const latestWeight = weightMeasurements.length > 0
    ? weightMeasurements[weightMeasurements.length - 1]
    : null;

  const plan = profile?.fasting_plan
    ? {
        label: profile.fasting_plan,
        fastingHours: profile.fasting_hours_goal ?? getPlanByLabel(profile.fasting_plan).fastingHours,
        eatingHours: profile.eating_hours_goal ?? getPlanByLabel(profile.fasting_plan).eatingHours
      }
    : getPlanByLabel("16:8");

  const completedSessions = sessions ?? [];
  const weeklyMinutes = getWeeklyFastingMinutes(completedSessions);
  const streak = calculateCurrentStreak(completedSessions);
  const activeFastStartsLater =
    activeSession && new Date(activeSession.start_time) > new Date();

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="page-header-fancy flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-moss-600">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold text-ink">
            {activeFastStartsLater
              ? "Scheduled Fast"
              : activeSession
                ? "Fasting"
                : "Eating Window"}
          </h1>
          <p className="mt-3 text-stone-600">
            Goal: {plan.fastingHours}h fasting / {plan.eatingHours}h eating
          </p>
        </div>
        <Link href="/onboarding" className="button-secondary">
          Adjust plan
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <TimerCard
            activeSession={activeSession}
            fastingHoursGoal={plan.fastingHours}
          />
          <FastingControls userId={user.id} activeSession={activeSession} />
          <WeightInput
            userId={user.id}
            latestWeight={latestWeight?.weight}
            latestUnit={latestWeight?.unit}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          <StatsCard
            label="Selected goal"
            value={plan.label}
            detail={`${plan.fastingHours}h fast`}
            icon={<Target size={21} aria-hidden="true" />}
          />
          <StatsCard
            label="Current streak"
            value={`${streak} ${streak === 1 ? "day" : "days"}`}
            detail="Completed fasts on consecutive days"
            icon={<Flame size={21} aria-hidden="true" />}
          />
          <StatsCard
            label="This week"
            value={formatDuration(weeklyMinutes)}
            detail="Completed fasting time"
            icon={<CalendarDays size={21} aria-hidden="true" />}
          />
        </div>
      </div>

      <div className="mt-5">
        <WeightChart data={weightMeasurements} />
      </div>
    </main>
  );
}
