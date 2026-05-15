import { redirect } from "next/navigation";
import SessionHistory from "@/components/SessionHistory";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("fasting_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("end_time", { ascending: false });

  return (
    <main className="page-shell py-8 sm:py-12">
      <div className="page-header-fancy">
        <p className="text-sm font-semibold uppercase text-moss-600">
          History
        </p>
        <h1 className="mt-2 text-4xl font-bold text-ink">Completed fasts</h1>
        <p className="mt-3 text-stone-600">
          Review past sessions sorted newest first.
        </p>
      </div>
      <SessionHistory sessions={sessions ?? []} />
    </main>
  );
}
