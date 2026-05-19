import { NextResponse } from "next/server";
import { parseEmailList, sendInviteEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "Fast together";
  const startTime =
    typeof body.startTime === "string" ? new Date(body.startTime) : null;
  const fastingHoursGoal = Number(body.fastingHoursGoal ?? 16);
  const inviteEmails = parseEmailList(body.inviteEmails);

  if (!startTime || Number.isNaN(startTime.getTime())) {
    return NextResponse.json({ error: "Choose a valid start time." }, { status: 400 });
  }

  if (
    !Number.isInteger(fastingHoursGoal) ||
    fastingHoursGoal < 1 ||
    fastingHoursGoal > 168
  ) {
    return NextResponse.json(
      { error: "Fasting goal must be between 1 and 168 hours." },
      { status: 400 }
    );
  }

  const { data: sharedFastId, error: createError } = await supabase.rpc(
    "create_shared_fast",
    {
      fast_title: title,
      fast_start_time: startTime.toISOString(),
      fast_fasting_hours_goal: fastingHoursGoal,
      invite_emails: inviteEmails
    }
  );

  if (createError || !sharedFastId) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create shared fast." },
      { status: 400 }
    );
  }

  if (inviteEmails.length === 0) {
    return NextResponse.json({
      sharedFastId,
      sent: 0,
      failed: []
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: invites, error: inviteError } = await supabase
    .from("shared_fast_invites")
    .select("invited_email, token")
    .eq("shared_fast_id", sharedFastId)
    .eq("created_by", user.id)
    .in("invited_email", inviteEmails);

  if (inviteError) {
    return NextResponse.json(
      { error: inviteError.message, sharedFastId },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const failed: string[] = [];

  for (const invite of invites ?? []) {
    if (!invite.invited_email) {
      continue;
    }

    const result = await sendInviteEmail({
      to: invite.invited_email,
      title,
      hostEmail: profile?.email ?? user.email ?? null,
      startTime: startTime.toISOString(),
      fastingHoursGoal,
      inviteUrl: `${origin}/together/invite/${invite.token}`
    });

    if (!result.ok) {
      failed.push(invite.invited_email);
    }
  }

  return NextResponse.json({
    sharedFastId,
    sent: (invites?.length ?? 0) - failed.length,
    failed
  });
}
