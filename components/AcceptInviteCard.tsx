"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

type InviteDetails = {
  title: string;
  start_time: string;
  fasting_hours_goal: number;
  host_email: string | null;
  invited_email: string | null;
  accepted_at: string | null;
};

type AcceptInviteCardProps = {
  token: string;
  invite: InviteDetails;
};

export default function AcceptInviteCard({
  token,
  invite
}: AcceptInviteCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const startLabel = new Date(invite.start_time).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const acceptInvite = async () => {
    setLoading(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before accepting an invite."
      );
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("accept_shared_fast_invite", {
      invite_token: token
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/together");
    router.refresh();
  };

  return (
    <section className="auth-panel-fancy w-full max-w-xl">
      <div className="grid size-12 place-items-center rounded-lg bg-moss-50 text-moss-700">
        <Users size={24} aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-semibold uppercase text-moss-600">
        Friend invite
      </p>
      <h1 className="mt-2 text-3xl font-bold text-ink">{invite.title}</h1>
      <div className="mt-5 grid gap-3 rounded-lg border border-moss-100 bg-white/70 p-4 text-sm text-stone-600">
        <p>
          Starts <span className="font-semibold text-ink">{startLabel}</span>
        </p>
        <p>
          Goal{" "}
          <span className="font-semibold text-ink">
            {invite.fasting_hours_goal} hours
          </span>
        </p>
        {invite.host_email && (
          <p>
            Host <span className="font-semibold text-ink">{invite.host_email}</span>
          </p>
        )}
      </div>

      {invite.accepted_at ? (
        <div className="mt-6 rounded-lg bg-moss-50 px-4 py-3 text-sm font-semibold text-moss-700">
          <CheckCircle2 className="mr-2 inline" size={17} aria-hidden="true" />
          You have already joined this fast.
        </div>
      ) : (
        <button
          type="button"
          onClick={acceptInvite}
          disabled={loading}
          className="button-primary mt-6 w-full"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {loading ? "Joining..." : "Join shared fast"}
        </button>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
          {message}
        </p>
      )}
    </section>
  );
}
