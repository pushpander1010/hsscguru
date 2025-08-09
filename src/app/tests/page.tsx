// src/app/tests/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Test = { slug: string; name: string };

export default function TestsPage() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data: userRes } = await supabase.auth.getUser();
      if (!active) return;
      setUserEmail(userRes.user?.email ?? null);

      const { data, error } = await supabase
        .schema("api")
        .from("tests_public")
        .select("slug,name")
        .order("name", { ascending: true });

      if (!active) return;

      if (error) {
        setErr("Failed to load tests");
      } else {
        setTests(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => tests.filter(Boolean), [tests]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-40 animate-pulse rounded bg-white/10" />
      </main>
    );
  }

  if (err) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-red-400">{err}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Available Tests</h1>
        <p className="text-sm text-white/60">
          {userEmail ? `Logged in as ${userEmail}` : "You&apos;re browsing as guest"}
        </p>
      </header>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((t) => (
          <li key={t.slug} className="rounded-xl border border-white/10 p-4 bg-[--surface]/80">
            <div className="font-medium">{t.name}</div>
            <div className="text-white/60 text-sm">Slug: {t.slug}</div>
            <div className="mt-3">
              <Link href={`/tests/${t.slug}/start`} className="btn-ghost">
                Start
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
