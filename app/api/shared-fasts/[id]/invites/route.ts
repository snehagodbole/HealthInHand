import { NextResponse } from "next/server";
import { parseEmailList, sendInviteEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type InviteRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: InviteRouteContext) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const inviteEmails = parseEmailList(body.inviteEmails);

  if (inviteEmails.length === 0) {
    return NextResponse.json(
      { error: "Add at least one email address." },
      { status: 400 }
    );
  }

  const { data: sharedFast, error: sharedFastError } = await supabase
    .from("shared_fasts")
    .select("id, owner_id, title, start_time, fasting_hours_goal")
    .eq("id", id)
    .maybeSingle();

  if (sharedFastError || !sharedFast) {
    return NextResponse.json(
      { error: sharedFastError?.message ?? "Shared fast not found." },
      { status: 404 }
    );
  }

  if (sharedFast.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the host can invite more friends." },
      { status: 403 }
    );
  }

  const { data: invites, error: inviteError } = await supabase
    .from("shared_fast_invites")
    .insert(
      inviteEmails.map((email) => ({
        shared_fast_id: id,
        invited_email: email,
        created_by: user.id
      }))
    )
    .select("invited_email, token");

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const origin = new URL(request.url).origin;
  const failed: string[] = [];

  for (const invite of invites ?? []) {
    if (!invite.invited_email) {
      continue;
    }

    const result = await sendInviteEmail({
      to: invite.invited_email,
      title: sharedFast.title,
      hostEmail: profile?.email ?? user.email ?? null,
      startTime: sharedFast.start_time,
      fastingHoursGoal: sharedFast.fasting_hours_goal,
      inviteUrl: `${origin}/together/invite/${invite.token}`
    });

    if (!result.ok) {
      failed.push(invite.invited_email);
    }
  }

  return NextResponse.json({
    sent: (invites?.length ?? 0) - failed.length,
    failed
  });
}
