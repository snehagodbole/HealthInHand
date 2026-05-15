"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserConfig
} from "@/lib/supabaseClient";

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/together", label: "Together" },
  { href: "/history", label: "History" },
  { href: "/progress", label: "Progress" }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig) {
      setReady(true);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      router.refresh();
    });

    return () => data.subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/80 backdrop-blur">
      <nav className="page-shell flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="grid size-9 place-items-center rounded-lg bg-moss-600 text-white">
            <Activity size={20} aria-hidden="true" />
          </span>
          <span className="hidden xs:inline">HealthInHand</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-2 md:flex">
          {user &&
            appLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-moss-50 text-moss-700"
                    : "text-stone-600 hover:bg-white hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop auth buttons */}
          {ready && user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="button-secondary hidden px-3 py-2 md:inline-flex"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="button-secondary px-4 py-2">
                Login
              </Link>
              <Link href="/signup" className="button-primary px-4 py-2">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-lg text-stone-600 transition hover:bg-moss-50 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="animate-slideDown border-t border-white/60 bg-white/95 backdrop-blur md:hidden">
          <div className="page-shell flex flex-col gap-1 py-3">
            {user ? (
              <>
                {appLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition active:scale-[0.98] ${
                      pathname === link.href
                        ? "bg-moss-50 text-moss-700"
                        : "text-stone-600 hover:bg-moss-50/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-1 border-stone-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-coral-600 transition active:scale-[0.98] hover:bg-coral-50/50"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1">
                <Link href="/login" className="button-secondary w-full">
                  Login
                </Link>
                <Link href="/signup" className="button-primary w-full">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
