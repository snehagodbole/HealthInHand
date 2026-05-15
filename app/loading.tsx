export default function Loading() {
  return (
    <main className="page-shell flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="hero-glass w-full max-w-lg p-8 text-center text-stone-500">
        <div className="mx-auto mb-4 size-9 animate-spin rounded-full border-4 border-moss-100 border-t-moss-600" />
        Loading your wellness dashboard...
      </div>
    </main>
  );
}
