"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig,
  supabaseBrowserConfigError
} from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectedFrom, setRedirectedFrom] = useState("/dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectedFrom(params.get("redirectedFrom") ?? "/dashboard");
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!hasSupabaseBrowserConfig) {
      setMessage(
        supabaseBrowserConfigError ??
          "Add Supabase environment variables before logging in."
      );
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      // Full-page navigation ensures the auth cookies are sent with the
      // request so the middleware sees the session on the protected route.
      window.location.href = redirectedFrom;
    }
  };

  return (
    <main className="page-shell grid min-h-[calc(100vh-4rem)] items-center gap-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="auth-panel-fancy w-full max-w-xl">
        <p className="text-sm font-semibold uppercase text-moss-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Login to HealthInHand</h1>
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {message && (
            <p className="rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-600">
              {message}
            </p>
          )}
          <button type="submit" disabled={loading} className="button-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-6 text-sm text-stone-500">
          New to HealthInHand?{" "}
          <Link href="/signup" className="font-semibold text-moss-700">
            Create an account
          </Link>
        </p>
      </section>

      <section className="hero-glass hidden p-6 sm:p-8 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-moss-600">
          Keep momentum
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink">Your next healthy streak starts today</h2>
        <p className="mt-4 text-stone-600">
          Log in to continue your fasting plan, track progress, and monitor your weight changes in one calm dashboard.
        </p>
        <div className="mt-6 rounded-xl border border-white/70 bg-white/70 p-5">
          <p className="text-sm font-medium text-stone-500">Motivation</p>
          <p className="mt-2 text-xl font-semibold text-ink">
            “Small daily discipline leads to big transformation.”
          </p>
        </div>
      </section>
    </main>
  );
}
