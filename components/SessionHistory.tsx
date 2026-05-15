import { format } from "date-fns";
import type { FastingSession } from "@/types/database";
import { formatDuration } from "@/lib/fastingUtils";

type SessionHistoryProps = {
  sessions: FastingSession[];
};

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold text-ink">No completed fasts yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Completed sessions will appear here after you end a fast.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-4 gap-4 border-b border-moss-100 px-5 py-4 text-sm font-semibold text-stone-500 md:grid">
        <span>Date</span>
        <span>Start</span>
        <span>End</span>
        <span>Duration</span>
      </div>
      <div className="divide-y divide-moss-100">
        {sessions.map((session) => {
          const start = new Date(session.start_time);
          const end = session.end_time ? new Date(session.end_time) : null;

          return (
            <div
              key={session.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-4 md:gap-4"
            >
              <div>
                <p className="text-xs font-semibold uppercase text-stone-400 md:hidden">
                  Date
                </p>
                <p className="font-medium text-ink">{format(start, "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-400 md:hidden">
                  Start
                </p>
                <p className="text-stone-600">{format(start, "p")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-400 md:hidden">
                  End
                </p>
                <p className="text-stone-600">{end ? format(end, "p") : "Active"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-stone-400 md:hidden">
                  Duration
                </p>
                <p className="font-semibold text-moss-700">
                  {formatDuration(session.duration_minutes)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
