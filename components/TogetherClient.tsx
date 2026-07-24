"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  Play,
  UserPlus,
  Users
} from "lucide-react";
import type {
  FastingSession,
  SharedFast,
  SharedFastInvite,
  SharedFastParticipant
} from "@/types/database";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

type SharedFastItem = SharedFast & {
  activeSessions: FastingSession[];
  invites: SharedFastInvite[];
  participants: SharedFastParticipant[];
};

type TogetherClientProps = {
  userId: string;
  activeSession: FastingSession | null;
  sharedFasts: SharedFastItem[];
};

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getInviteUrl(token: string) {
  if (typeof window === "undefined") {
    return `/together/invite/${token}`;
  }

  return `${window.location.origin}/together/invite/${token}`;
}

function parseInviteEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function getDefaultStartTime() {
  return toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

export default function TogetherClient({
  userId,
  activeSession,
  sharedFasts
}: TogetherClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("Weekend reset");
  const [startTime, setStartTime] = useState("");
  const [fastingHoursGoal, setFastingHoursGoal] = useState(16);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteInputs, setInviteInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStartTime(getDefaultStartTime());
  }, []);

  const sortedSharedFasts = useMemo(
    () =>
      [...sharedFasts].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ),
    [sharedFasts]
  );

  const copyInvite = async (token: string) => {
    await navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1800);
  };

  const createSharedFast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading("create");
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before creating a shared fast."
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

    const emails = parseInviteEmails(inviteEmails);

    const response = await fetch("/api/shared-fasts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title.trim() || "Fast together",
        startTime: selectedStartTime.toISOString(),
        fastingHoursGoal,
        inviteEmails: emails
      })
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Could not create shared fast.");
      setLoading(null);
      return;
    }

    setTitle("Weekend reset");
    setStartTime(getDefaultStartTime());
    setFastingHoursGoal(16);
    setInviteEmails("");
    setMessage(
      result.failed?.length > 0
        ? `Shared fast created, but ${result.failed.length} email ${
            result.failed.length === 1 ? "invite" : "invites"
          } could not be sent.`
        : emails.length > 0
        ? `${result.sent ?? emails.length} ${
            (result.sent ?? emails.length) === 1 ? "invite was" : "invites were"
          } sent.`
        : "Shared fast created. Add a friend email below to make an invite link."
    );
    router.refresh();
    setLoading(null);
  };

  const addInvite = async (sharedFastId: string) => {
    const emails = parseInviteEmails(inviteInputs[sharedFastId] ?? "");

    if (emails.length === 0) {
      setMessage("Add at least one email address.");
      return;
    }

    setLoading(`invite-${sharedFastId}`);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before inviting friends."
      );
      setLoading(null);
      return;
    }

    const response = await fetch(`/api/shared-fasts/${sharedFastId}/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inviteEmails: emails
      })
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Could not send invite.");
    } else {
      setInviteInputs((current) => ({ ...current, [sharedFastId]: "" }));
      setMessage(
        result.failed?.length > 0
          ? `${result.sent ?? 0} ${
              result.sent === 1 ? "invite was" : "invites were"
            } sent, but ${result.failed.length} failed.`
          : "Invite email sent."
      );
      router.refresh();
    }

    setLoading(null);
  };

  const startTogether = async (sharedFast: SharedFastItem) => {
    if (activeSession) {
      setMessage("End your current fast before starting another one.");
      return;
    }

    setLoading(`start-${sharedFast.id}`);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before starting a shared fast."
      );
      setLoading(null);
      return;
    }

    const plannedStart = new Date(sharedFast.start_time);
    const startAt =
      plannedStart.getTime() > Date.now() ? plannedStart : new Date();

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sign in again before starting a shared fast.");
      setLoading(null);
      return;
    }

    const { error } = await supabase.from("fasting_sessions").insert({
      user_id: user.id,
      shared_fast_id: sharedFast.id,
      start_time: startAt.toISOString(),
      status: "active"
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("You are fasting with the group now.");
      router.refresh();
    }

    setLoading(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
      <section className="card p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-moss-50 text-moss-700">
            <UserPlus size={21} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-moss-600">
              New group fast
            </p>
            <h2 className="text-xl font-bold text-ink">Invite friends</h2>
          </div>
        </div>

        <form onSubmit={createSharedFast} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Name
            </span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Start time
              </span>
              <input
                className="input"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Goal
              </span>
              <input
                className="input"
                type="number"
                min={1}
                max={168}
                value={fastingHoursGoal}
                onChange={(event) =>
                  setFastingHoursGoal(Number(event.target.value))
                }
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Friend emails
            </span>
            <textarea
              className="input min-h-28 resize-y"
              value={inviteEmails}
              onChange={(event) => setInviteEmails(event.target.value)}
              placeholder="friend@example.com, another@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading === "create"}
            className="button-primary w-full"
          >
            <UserPlus size={18} aria-hidden="true" />
            {loading === "create" ? "Creating..." : "Create shared fast"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-moss-50 px-4 py-3 text-sm text-moss-700">
            {message}
          </p>
        )}
      </section>

      <section className="space-y-4">
        {sortedSharedFasts.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="mx-auto text-moss-600" size={28} aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-ink">
              No shared fasts yet
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Create one, invite a friend, and start from the same plan.
            </p>
          </div>
        ) : (
          sortedSharedFasts.map((sharedFast) => {
            const isOwner = sharedFast.owner_id === userId;
            const userIsFastingHere =
              activeSession?.shared_fast_id === sharedFast.id;
            const startLabel = mounted
              ? new Date(sharedFast.start_time).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })
              : "Scheduled";

            return (
              <article key={sharedFast.id} className="card p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-ink">
                        {sharedFast.title}
                      </h2>
                      {isOwner && (
                        <span className="rounded-full bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-600">
                          Host
                        </span>
                      )}
                      {userIsFastingHere && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-moss-50 px-3 py-1 text-xs font-semibold text-moss-700">
                          <CheckCircle2 size={13} aria-hidden="true" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={16} aria-hidden="true" />
                        {startLabel}
                      </span>
                      <span>{sharedFast.fasting_hours_goal}h goal</span>
                      <span>
                        {sharedFast.participants.length}{" "}
                        {sharedFast.participants.length === 1
                          ? "participant"
                          : "participants"}
                      </span>
                      <span>
                        {sharedFast.activeSessions.length}{" "}
                        {sharedFast.activeSessions.length === 1
                          ? "active fast"
                          : "active fasts"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startTogether(sharedFast)}
                    disabled={Boolean(activeSession) || loading === `start-${sharedFast.id}`}
                    className="button-primary shrink-0"
                  >
                    <Play size={18} aria-hidden="true" />
                    {userIsFastingHere ? "Started" : "Start with group"}
                  </button>
                </div>

                {isOwner && (
                  <div className="mt-5 border-t border-moss-100 pt-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        className="input"
                        value={inviteInputs[sharedFast.id] ?? ""}
                        onChange={(event) =>
                          setInviteInputs((current) => ({
                            ...current,
                            [sharedFast.id]: event.target.value
                          }))
                        }
                        placeholder="Add another friend email"
                      />
                      <button
                        type="button"
                        onClick={() => addInvite(sharedFast.id)}
                        disabled={loading === `invite-${sharedFast.id}`}
                        className="button-secondary"
                      >
                        <LinkIcon size={17} aria-hidden="true" />
                        Add invite
                      </button>
                    </div>

                    {sharedFast.invites.length > 0 && (
                      <div className="mt-4 grid gap-2">
                        {sharedFast.invites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex flex-col justify-between gap-2 rounded-lg border border-moss-100 bg-white/70 px-3 py-2 sm:flex-row sm:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {invite.invited_email ?? "Invite link"}
                              </p>
                              <p className="text-xs text-stone-500">
                                {invite.accepted_at ? "Accepted" : "Waiting"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyInvite(invite.token)}
                              className="button-secondary px-3 py-2"
                            >
                              <Copy size={16} aria-hidden="true" />
                              {copiedToken === invite.token ? "Copied" : "Copy"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
