import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock3, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative">
      <section className="page-shell grid min-h-[calc(100vh-4rem)] items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hero-glass p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase text-moss-600">
            Intermittent fasting tracker
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight text-ink sm:text-6xl">
            HealthinHand
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Plan your fasting window, start and stop sessions, and see your
            streaks and weekly progress in a calm web dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="button-primary">
              Get Started
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/login" className="button-secondary">
              I already have an account
            </Link>
          </div>
        </div>

        <div className="hero-glass p-5 sm:p-7">
          <div className="rounded-xl bg-ink p-5 text-white shadow-xl shadow-ink/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Current fast</p>
              <span className="rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold">
                Live
              </span>
            </div>
            <p className="mt-6 text-5xl font-bold">13:42:18</p>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-3/4 rounded-full bg-coral-500" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-white/60">Plan</p>
                <p className="mt-1 font-semibold">16:8</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-white/60">Streak</p>
                <p className="mt-1 font-semibold">5 days</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-white/60">Week</p>
                <p className="mt-1 font-semibold">48h</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-fancy py-16">
        <div className="page-shell grid gap-5 md:grid-cols-3">
          {[
            {
              icon: <Clock3 size={24} aria-hidden="true" />,
              title: "Track fasting windows",
              text: "Start and end fasts from your browser while the timer keeps calculating from your saved start time."
            },
            {
              icon: <CalendarCheck size={24} aria-hidden="true" />,
              title: "Choose your rhythm",
              text: "Use popular plans like 16:8, 18:6, 20:4, OMAD, or set a custom split during onboarding."
            },
            {
              icon: <ShieldCheck size={24} aria-hidden="true" />,
              title: "Review progress",
              text: "See completed sessions, streaks, weekly fasting hours, longest fast, and average duration."
            }
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <div className="grid size-11 place-items-center rounded-lg bg-moss-50 text-moss-700">
                {item.icon}
              </div>
              <h2 className="mt-5 text-xl font-bold text-ink">{item.title}</h2>
              <p className="mt-3 leading-7 text-stone-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="hero-glass border-coral-100 bg-coral-50/70 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-ink">Health disclaimer</h2>
          <p className="mt-3 max-w-3xl leading-7 text-stone-700">
            This app is for general wellness tracking only and does not provide
            medical advice. Speak with a qualified health professional before
            changing eating patterns, especially if you have a medical condition,
            are pregnant, or take medication.
          </p>
        </div>
      </section>
    </main>
  );
}
