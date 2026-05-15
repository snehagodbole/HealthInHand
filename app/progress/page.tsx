import { redirect } from "next/navigation";
import { Award, BarChart3, Timer } from "lucide-react";
import ProgressChart from "@/components/ProgressChart";
import StatsCard from "@/components/StatsCard";
import WeightTracker from "@/components/WeightTracker";
import {
  formatDuration,
  getAverageFastMinutes,
  getLongestFastMinutes,
  getWeeklyChartData,
  getWeeklyFastingMinutes
} from "@/lib/fastingUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: sessions }, { data: weightMeasurements }] = await Promise.all([
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

  const completedSessions = sessions ?? [];
  const weeklyData = getWeeklyChartData(completedSessions);
  const weeklyMinutes = getWeeklyFastingMinutes(completedSessions);
  const longestFast = getLongestFastMinutes(completedSessions);
  const averageFast = getAverageFastMinutes(completedSessions);

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="page-header-fancy">
        <p className="text-sm font-semibold uppercase text-moss-600">
          Progress
        </p>
        <h1 className="mt-2 text-4xl font-bold text-ink">Your fasting trends</h1>
        <p className="mt-3 text-stone-600">
          Weekly hours and session summaries from completed fasts.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <ProgressChart data={weeklyData} />
        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
          <StatsCard
            label="Weekly total"
            value={formatDuration(weeklyMinutes)}
            detail="Completed this week"
            icon={<BarChart3 size={21} aria-hidden="true" />}
          />
          <StatsCard
            label="Longest fast"
            value={formatDuration(longestFast)}
            detail="Best completed session"
            icon={<Award size={21} aria-hidden="true" />}
          />
          <StatsCard
            label="Average duration"
            value={formatDuration(averageFast)}
            detail="Across completed fasts"
            icon={<Timer size={21} aria-hidden="true" />}
          />
        </div>
      </div>

      <WeightTracker
        userId={user.id}
        measurements={weightMeasurements ?? []}
      />
    </main>
  );
}
