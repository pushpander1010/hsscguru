// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type TestMini = { slug: string; name: string } | null;

type Row = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests: TestMini; // normalized to a single object (or null)
};

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr(null);

      // 1) who is logged in?
      const { data: userRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) {
        if (!mounted) return;
        setErr(uErr.message);
        setLoading(false);
        return;
      }
      const user = userRes.user;
      if (!user) {
        if (!mounted) return;
        setUserEmail(null);
        setRows([]);
        setLoading(false);
        return;
      }
      setUserEmail(user.email ?? null);

      // 2) fetch attempts + joined tests
      const { data, error } = await supabase
        .from("attempts")
        .select("id, test_id, started_at, finished_at, score, tests(slug,name)")
        .order("started_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        // Normalize tests: Supabase may return tests as an array; pick the first item.
        const normalized: Row[] = (data as any[] ?? []).map((r: any) => {
          const t = Array.isArray(r.tests) ? (r.tests[0] ?? null) : (r.tests ?? null);
          return {
            id: String(r.id),
            test_id: String(r.test_id),
            started_at: r.started_at ?? null,
            finished_at: r.finished_at ?? null,
            score: r.score ?? null,
            tests: t ? { slug: String(t.slug), name: String(t.name) } : null,
          };
        });
        setRows(normalized);
      }
      setLoading(false);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-3">Dashboard</h1>
        <p className="opacity-70">Loading…</p>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-3">Dashboard</h1>
        <p>
          Please <a className="underline" href="/login">log in</a> to view your attempts.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3">
        <a className="border rounded p-3" href="/practice">🧠 Take a Practice Test</a>
        <a className="border rounded p-3" href="/tests">📝 Full Mock Tests</a>
        <div className="grid sm:grid-cols-3 gap-3">
          <a className="border rounded p-3" href="/notes">📒 Notes</a>
          <a className="border rounded p-3" href="/haryana-gk">🌾 Haryana GK</a>
          <a className="border rounded p-3" href="/jobs">📢 Job Updates</a>
        </div>
      </div>

      {err && (
        <div className="p-3 border rounded text-sm text-red-600">Error: {err}</div>
      )}

      <h2 className="text-xl font-semibold mt-4">Your Attempts</h2>
      {!rows || rows.length === 0 ? (
        <div className="border rounded p-3 text-sm">
          No attempts yet. Try a practice test!
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const testName = r.tests?.name ?? "Unknown Test";
            const when = r.started_at ? new Date(r.started_at).toLocaleString() : "";
            return (
              <div key={r.id} className="border rounded p-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{testName}</div>
                  <div className="text-xs opacity-70">{when}</div>
                </div>
                <div className="text-sm">
                  {r.finished_at ? `Score: ${r.score ?? 0}` : "In progress"}
                </div>
                <Link className="border rounded px-3 py-1 text-sm" href={`/results/${r.id}`}>
                  View
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
