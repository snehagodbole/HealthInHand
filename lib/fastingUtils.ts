import {
  differenceInMinutes,
  endOfWeek,
  format,
  isWithinInterval,
  startOfWeek
} from "date-fns";
import type { FastingSession, FastingPlan } from "@/types/database";

export const fastingPlans: FastingPlan[] = [
  { label: "16:8", fastingHours: 16, eatingHours: 8 },
  { label: "18:6", fastingHours: 18, eatingHours: 6 },
  { label: "20:4", fastingHours: 20, eatingHours: 4 },
  { label: "OMAD", fastingHours: 23, eatingHours: 1 },
  { label: "Custom", fastingHours: 16, eatingHours: 8 }
];

export function getPlanByLabel(label?: string | null) {
  return fastingPlans.find((plan) => plan.label === label) ?? fastingPlans[0];
}

export function formatDuration(totalMinutes: number | null | undefined) {
  if (!totalMinutes || totalMinutes < 1) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function getElapsedFromStart(startTime: string) {
  return Math.max(0, differenceInMinutes(new Date(), new Date(startTime)));
}

export function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((segment) => segment.toString().padStart(2, "0"))
    .join(":");
}

export function getWeeklyFastingMinutes(sessions: FastingSession[]) {
  const today = new Date();
  const week = {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 })
  };

  return sessions
    .filter((session) => {
      if (session.status !== "completed" || !session.end_time) {
        return false;
      }

      return isWithinInterval(new Date(session.end_time), week);
    })
    .reduce((total, session) => total + (session.duration_minutes ?? 0), 0);
}

export function getWeeklyChartData(sessions: FastingSession[]) {
  const buckets = new Map<string, number>();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    buckets.set(format(date, "EEE"), 0);
  }

  sessions.forEach((session) => {
    if (session.status !== "completed" || !session.end_time) {
      return;
    }

    const endedAt = new Date(session.end_time);
    if (!isWithinInterval(endedAt, { start: weekStart, end: endOfWeek(today, { weekStartsOn: 1 }) })) {
      return;
    }

    const label = format(endedAt, "EEE");
    buckets.set(label, (buckets.get(label) ?? 0) + (session.duration_minutes ?? 0) / 60);
  });

  return Array.from(buckets.entries()).map(([day, hours]) => ({
    day,
    hours: Number(hours.toFixed(1))
  }));
}

export function getLongestFastMinutes(sessions: FastingSession[]) {
  return sessions.reduce(
    (longest, session) => Math.max(longest, session.duration_minutes ?? 0),
    0
  );
}

export function getAverageFastMinutes(sessions: FastingSession[]) {
  const completed = sessions.filter(
    (session) => session.status === "completed" && session.duration_minutes
  );

  if (completed.length === 0) {
    return 0;
  }

  const total = completed.reduce(
    (sum, session) => sum + (session.duration_minutes ?? 0),
    0
  );

  return Math.round(total / completed.length);
}
