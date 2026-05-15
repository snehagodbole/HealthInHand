import Link from "next/link";
import { redirect } from "next/navigation";
import AcceptInviteCard from "@/components/AcceptInviteCard";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=/together/invite/${token}`);
  }

  const { data, error } = await supabase.rpc("get_shared_fast_invite", {
    invite_token: token
  });

  const invite = data?.[0];

  if (error || !invite) {
    return (
      <main className="page-shell grid min-h-[calc(100vh-4rem)] place-items-center py-12">
        <section className="auth-panel-fancy w-full max-w-xl text-center">
          <p className="text-sm font-semibold uppercase text-coral-600">
            Invite unavailable
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">
            This shared fast invite could not be opened.
          </h1>
          <p className="mt-4 text-stone-600">
            The link may be expired, mistyped, or tied to a different email.
          </p>
          <Link href="/together" className="button-primary mt-6">
            Back to Together
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell grid min-h-[calc(100vh-4rem)] place-items-center py-12">
      <AcceptInviteCard token={token} invite={invite} />
    </main>
  );
}
