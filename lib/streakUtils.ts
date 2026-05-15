import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { FastingSession } from "@/types/database";

export function calculateCurrentStreak(sessions: FastingSession[]) {
  const completedDates = Array.from(
    new Set(
      sessions
        .filter((session) => session.status === "completed" && session.end_time)
        .map((session) => startOfDay(new Date(session.end_time as string)).getTime())
    )
  )
    .sort((a, b) => b - a)
    .map((time) => new Date(time));

  if (completedDates.length === 0) {
    return 0;
  }

  const today = startOfDay(new Date());
  const newestDate = completedDates[0];
  const newestDiff = differenceInCalendarDays(today, newestDate);

  if (newestDiff > 1) {
    return 0;
  }

  let streak = 1;
  let previous = newestDate;

  for (const current of completedDates.slice(1)) {
    if (differenceInCalendarDays(previous, current) === 1) {
      streak += 1;
      previous = current;
    } else {
      break;
    }
  }

  return streak;
}
