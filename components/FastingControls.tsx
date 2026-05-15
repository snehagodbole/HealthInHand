"use client";

import { useRouter } from "next/navigation";
import { Clock3, Play, Square } from "lucide-react";
import { useState } from "react";
import { differenceInMinutes } from "date-fns";
import type { FastingSession } from "@/types/database";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

type FastingControlsProps = {
  userId: string;
  activeSession: FastingSession | null;
};

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function FastingControls({
  userId,
  activeSession
}: FastingControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"start" | "end" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(() =>
    toDateTimeLocalValue(new Date())
  );

  const startFast = async () => {
    setLoading("start");
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before starting a fast."
      );
      setLoading(null);
      return;
    }

    const selectedStartTime = new Date(startTime);

    if (Number.isNaN(selectedStartTime.getTime())) {
      setMessage("Choose a valid start time.");
      setLoading(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data: existing } = await supabase
      .from("fasting_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      setMessage("You already have an active fast.");
      setLoading(null);
      return;
    }

    const { error } = await supabase.from("fasting_sessions").insert({
      user_id: userId,
      start_time: selectedStartTime.toISOString(),
      status: "active"
    });

    if (error) {
      setMessage(error.message);
    } else {
      setStartTime(toDateTimeLocalValue(new Date()));
      router.refresh();
    }

    setLoading(null);
  };

  const endFast = async () => {
    if (!activeSession) {
      return;
    }

    setLoading("end");
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before ending a fast."
      );
      setLoading(null);
      return;
    }

    const endedAt = new Date();
    const startedAt = new Date(activeSession.start_time);

    if (endedAt < startedAt) {
      setMessage("This fast is scheduled for later, so it cannot be ended yet.");
      setLoading(null);
      return;
    }

    const durationMinutes = Math.max(
      1,
      differenceInMinutes(endedAt, startedAt)
    );

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("fasting_sessions")
      .update({
        end_time: endedAt.toISOString(),
        duration_minutes: durationMinutes,
        status: "completed"
      })
      .eq("id", activeSession.id)
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      setMessage(error.message);
    } else {
      router.refresh();
    }

    setLoading(null);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Start time
          </span>
          <input
            className="input"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            disabled={Boolean(activeSession) || loading !== null}
            required
          />
        </label>
        <button
          type="button"
          onClick={() => setStartTime(toDateTimeLocalValue(new Date()))}
          disabled={Boolean(activeSession) || loading !== null}
          className="button-secondary min-h-12 px-4"
          aria-label="Use current time"
          title="Use current time"
        >
          <Clock3 size={18} aria-hidden="true" />
          <span className="sm:hidden">Now</span>
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={startFast}
          disabled={Boolean(activeSession) || loading !== null}
          className="button-primary min-h-12"
        >
          <Play size={18} aria-hidden="true" />
          Start Fast
        </button>
        <button
          type="button"
          onClick={endFast}
          disabled={!activeSession || loading !== null}
          className="button-secondary min-h-12"
        >
          End Fast
        </button>
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
          {message}
        </p>
      )}
    </div>
  );
}
