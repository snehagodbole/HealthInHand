"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before signing up."
      );
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user && data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email
      });
      // Full-page navigation ensures auth cookies are sent when middleware
      // checks the protected onboarding route.
      window.location.href = "/onboarding";
    } else {
      setMessage("Check your email to confirm your account, then log in.");
    }

    setLoading(false);
  };

  return (
    <main className="page-shell grid min-h-[calc(100vh-4rem)] items-center gap-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="auth-panel-fancy w-full max-w-xl">
        <p className="text-sm font-semibold uppercase text-moss-600">
          Start tracking
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Create your account</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Email
            </span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Password
            </span>
            <input
              className="input"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          {message && (
            <p className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
              {message}
            </p>
          )}
          <button type="submit" disabled={loading} className="button-primary w-full">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-moss-700">
            Login
          </Link>
        </p>
      </section>

      <section className="hero-glass hidden p-6 sm:p-8 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-moss-600">
          Build healthy habits
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Create your fasting journey</h2>
        <p className="mt-4 text-stone-600">
          Set your fasting rhythm, see your trends, and stay motivated with stage-based insights and progress visuals.
        </p>
        <div className="mt-6 rounded-xl border border-white/70 bg-white/70 p-5">
          <p className="text-sm font-medium text-stone-500">Quick start</p>
          <ul className="mt-2 space-y-2 text-sm text-stone-600">
            <li>• Pick a fasting goal</li>
            <li>• Start your first fast</li>
            <li>• Track weight fluctuations</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
