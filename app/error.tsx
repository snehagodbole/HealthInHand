"use client";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <section className="hero-glass max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase text-coral-600">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-bold text-ink">
          HealthInHand could not load this page.
        </h1>
        <p className="mt-4 rounded-lg bg-coral-50/80 px-4 py-3 text-sm leading-6 text-stone-600">
          {error.message}
        </p>
        <button type="button" onClick={reset} className="button-primary mt-6">
          Try again
        </button>
      </section>
    </main>
  );
}
