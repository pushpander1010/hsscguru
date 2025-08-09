// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ROUTES } from "@/lib/routes";
import Logo from "./Logo";

type MiniUser = {
  email: string | null;
  user_metadata?: { name?: string; avatar_url?: string };
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<MiniUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      const u = data.user
        ? {
            email: data.user.email ?? null, // normalize to null
            user_metadata: data.user.user_metadata as MiniUser["user_metadata"],
          }
        : null;

      setUser(u);
      setLoading(false);
    }

    loadUser();

    // Realtime auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
        ? {
            email: session.user.email ?? null, // normalize to null
            user_metadata: session.user.user_metadata as MiniUser["user_metadata"],
          }
        : null;

      setUser(u);
      router.refresh();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push(ROUTES.home);
    router.refresh();
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "User");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[--surface]/80 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        {/* Left: Logo */}
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <Logo />
        </Link>

        {/* Middle: Links */}
        <ul className="ml-6 flex flex-wrap items-center gap-2">
          <li>
            <Link className="btn-ghost" href={ROUTES.dashboard}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link className="btn-ghost" href={ROUTES.practice}>
              Practice
            </Link>
          </li>
          <li>
            <Link className="btn-ghost" href={ROUTES.Tests}>
              Mock Tests
            </Link>
          </li>
          <li>
            <Link className="btn-ghost" href={ROUTES.haryanaUpdates}>
              Haryana Updates
            </Link>
          </li>
          <li>
            <Link className="btn-ghost" href={ROUTES.notes}>
              Notes
            </Link>
          </li>
        </ul>

        {/* Spacer pushes auth to extreme right */}
        <div className="ms-auto" />

        {/* Right: Auth */}
        <div className="relative">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-medium">
                  {initials(displayName)}
                </div>
              )}
              <span className="hidden sm:block text-sm">{displayName}</span>
              <svg
                aria-hidden
                className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" />
              </svg>
            </button>
          ) : (
            <Link href={ROUTES.login ?? "/login"} className="btn-ghost">
              Log in
            </Link>
          )}

          {/* Dropdown */}
          {user && menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[--surface] shadow-lg"
            >
              <div className="px-4 py-3 text-sm border-b border-white/10">
                <div className="font-medium truncate">{displayName}</div>
                <div className="text-white/60 truncate">{user.email}</div>
              </div>
              <ul className="p-1 text-sm">
                <li>
                  <Link
                    href={ROUTES.dashboard ?? "/profile"}
                    className="block rounded-lg px-3 py-2 hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.dashboard}
                    className="block rounded-lg px-3 py-2 hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                    onClick={onLogout}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/10"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

/* ---- helpers ---- */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}
