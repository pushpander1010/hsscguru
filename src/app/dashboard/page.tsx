// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type TestMini = { slug: string; name: string } | null;

type AttemptRow = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests: TestMini; // normalized to single object or null
};

// Matches what Supabase might return from the join (object OR array OR null)
type TestsRel = { slug: string; name: string };
type RawAttemptRow = Omit<AttemptRow, "tests"> & {
  tests: TestsRel | TestsRel[] | null;
};

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErr(null);

      // Who is logged in?
      const { data: userRes, error: uErr } = await supabase.auth.getUser();
      if (!active) return;

      if (uErr) {
        setErr("Failed to fetch user");
        setLoading(false);
        return;
      }
      setUserEmail(userRes.user?.email ?? null);

      // Load attempts with joined test (may come back as object OR array)
      const { data, error } = await supabase
        .schema("api")
        .from("attempts_public")
        .select(
          "id,test_id,started_at,finished_at,score,tests:tests_public(slug,name)"
        )
        .order("started_at", { ascending: false });

      if (!active) return;

      if (error) {
        setErr("Failed to load dashboard data");
        setRows([]);
        setLoading(false);
        return;
      }

      // Normalize tests field
      const raw: RawAttemptRow[] = (data ?? []) as unknown as RawAttemptRow[];
      const normalized: AttemptRow[] = raw.map((r) => ({
        id: r.id,
        test_id: r.test_id,
        started_at: r.started_at,
        finished_at: r.finished_at,
        score: r.score,
        tests: Array.isArray(r.tests)
          ? (r.tests[0] ?? null)
          : (r.tests ?? null),
      }));

      setRows(normalized);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

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
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-white/60">
          {userEmail ? `Welcome, ${userEmail}` : "You&apos;re browsing as guest"}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-6 bg-[--surface]/80">
          <p className="text-white/70">No attempts yet.</p>
          <div className="mt-4">
            <Link href="/tests" className="btn-ghost">
              Browse Tests
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-white/10 p-4 bg-[--surface]/80 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{r.tests?.name ?? "Unknown Test"}</div>
                <div className="text-xs text-white/60">
                  Started: {r.started_at ?? "-"} | Finished: {r.finished_at ?? "-"}
                </div>
              </div>
              <div className="text-sm">
                Score: <span className="font-semibold">{r.score ?? "-"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
