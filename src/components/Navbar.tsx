"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded hover:bg-gray-100 ${
        active ? "font-semibold bg-gray-100" : ""
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // read current user
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    // react to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold">
          <span
            className="px-2 py-1 rounded"
            style={{ background: "rgb(var(--brand))", color: "white" }}
          >
            HSSC
          </span>{" "}
          Guru
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/practice" label="Practice" />
          <NavLink href="/tests" label="Mock Tests" />
          <NavLink href="/haryana-updates" label="Haryana Updates" />
          <NavLink href="/notes" label="Notes" />
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <>
              <Link
                href="/profile"
                className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
              >
                {email}
              </Link>
              <button
                className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/"; // simple refresh
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <div className="sm:hidden border-t">
        <div className="mx-auto max-w-5xl px-2 py-2 flex flex-wrap gap-2">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/practice" label="Practice" />
          <NavLink href="/tests" label="Mock Tests" />
          <NavLink href="/haryana-updates" label="Haryana Updates" />
          <NavLink href="/notes" label="Notes" />
        </div>
      </div>
    </header>
  );
}
