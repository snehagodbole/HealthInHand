"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import type { FastingSession } from "@/types/database";
import { formatTimer } from "@/lib/fastingUtils";
import {
  getCurrentMilestone,
  getNextMilestone
} from "@/lib/fastingMilestones";

type TimerCardProps = {
  activeSession: FastingSession | null;
  fastingHoursGoal: number;
};

export default function TimerCard({
  activeSession,
  fastingHoursGoal
}: TimerCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const startTimestamp = activeSession
    ? new Date(activeSession.start_time).getTime()
    : null;
  const isScheduled =
    typeof startTimestamp === "number" && startTimestamp > now;
  const startLabel =
    typeof startTimestamp === "number"
      ? new Date(startTimestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })
      : null;

  const elapsedSeconds = useMemo(() => {
    if (!startTimestamp) {
      return 0;
    }

    return Math.max(0, Math.floor((now - startTimestamp) / 1000));
  }, [startTimestamp, now]);

  const goalSeconds = fastingHoursGoal * 3600;
  const progress = activeSession
    ? Math.min(100, Math.round((elapsedSeconds / goalSeconds) * 100))
    : 0;

  const elapsedHours = elapsedSeconds / 3600;
  const currentMilestone = getCurrentMilestone(elapsedHours);
  const nextMilestone = getNextMilestone(elapsedHours);

  return (
    <section className="card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-moss-600">
            Live timer
          </p>
          <h1 className="mt-2 text-4xl font-bold text-ink sm:text-6xl">
            {formatTimer(elapsedSeconds)}
          </h1>
          {startLabel && (
            <p className="mt-3 text-sm text-stone-500">
              {isScheduled ? "Starts" : "Started"} {startLabel}
            </p>
          )}
        </div>
        <div className="grid size-14 place-items-center rounded-lg bg-coral-50 text-coral-600">
          <Clock size={28} aria-hidden="true" />
        </div>
      </div>

      {/* Fasting stage & motivational message */}
      {activeSession && !isScheduled && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentMilestone.color}`}
            >
              <Sparkles size={14} aria-hidden="true" />
              {currentMilestone.stage}
            </span>
            {nextMilestone && (
              <span className="text-xs text-stone-400">
                Next: {nextMilestone.stage} at {nextMilestone.hours}h
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            {currentMilestone.message}
          </p>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-2 flex justify-between text-sm text-stone-500">
          <span>
            {isScheduled && startLabel
              ? `Scheduled for ${startLabel}`
              : activeSession
                ? "Fast in progress"
                : "No active fast"}
          </span>
          <span>{progress}% of goal</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-moss-100">
          <div
            className="h-full rounded-full bg-moss-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
