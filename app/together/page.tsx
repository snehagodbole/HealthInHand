import { redirect } from "next/navigation";
import TogetherClient from "@/components/TogetherClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  FastingSession,
  SharedFast,
  SharedFastInvite,
  SharedFastParticipant
} from "@/types/database";

export const dynamic = "force-dynamic";

type SharedFastItem = SharedFast & {
  activeSessions: FastingSession[];
  invites: SharedFastInvite[];
  participants: SharedFastParticipant[];
};

export default async function TogetherPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/together");
  }

  const [{ data: activeSession }, { data: memberships }, { data: ownedFasts }] =
    await Promise.all([
      supabase
        .from("fasting_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("shared_fast_participants")
        .select("shared_fast_id")
        .eq("user_id", user.id)
        .eq("status", "joined"),
      supabase
        .from("shared_fasts")
        .select("*")
        .eq("owner_id", user.id)
        .order("start_time", { ascending: true })
    ]);

  const joinedIds = Array.from(
    new Set((memberships ?? []).map((membership) => membership.shared_fast_id))
  );

  const { data: joinedFasts } =
    joinedIds.length > 0
      ? await supabase
          .from("shared_fasts")
          .select("*")
          .in("id", joinedIds)
          .order("start_time", { ascending: true })
      : { data: [] as SharedFast[] };

  const sharedFastMap = new Map<string, SharedFast>();

  for (const sharedFast of [...(ownedFasts ?? []), ...(joinedFasts ?? [])]) {
    sharedFastMap.set(sharedFast.id, sharedFast);
  }

  const sharedFasts = Array.from(sharedFastMap.values());
  const sharedFastIds = sharedFasts.map((sharedFast) => sharedFast.id);

  const [{ data: participants }, { data: invites }, { data: activeSessions }] =
    sharedFastIds.length > 0
      ? await Promise.all([
          supabase
            .from("shared_fast_participants")
            .select("*")
            .in("shared_fast_id", sharedFastIds)
            .eq("status", "joined"),
          supabase
            .from("shared_fast_invites")
            .select("*")
            .in("shared_fast_id", sharedFastIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("fasting_sessions")
            .select("*")
            .in("shared_fast_id", sharedFastIds)
            .eq("status", "active")
        ])
      : [
          { data: [] as SharedFastParticipant[] },
          { data: [] as SharedFastInvite[] },
          { data: [] as FastingSession[] }
        ];

  const sharedFastItems: SharedFastItem[] = sharedFasts.map((sharedFast) => ({
    ...sharedFast,
    activeSessions: (activeSessions ?? []).filter(
      (session) => session.shared_fast_id === sharedFast.id
    ),
    invites: (invites ?? []).filter(
      (invite) => invite.shared_fast_id === sharedFast.id
    ),
    participants: (participants ?? []).filter(
      (participant) => participant.shared_fast_id === sharedFast.id
    )
  }));

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="page-header-fancy">
        <p className="text-sm font-semibold uppercase text-moss-600">
          Together
        </p>
        <h1 className="mt-2 text-4xl font-bold text-ink">
          Fast with friends
        </h1>
        <p className="mt-3 text-stone-600">
          Create a shared fasting plan, copy invite links, and start from the
          same goal.
        </p>
      </div>

      <TogetherClient
        userId={user.id}
        activeSession={activeSession}
        sharedFasts={sharedFastItems}
      />
    </main>
  );
}
