"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";

type TestMini = { slug: string; name: string } | null;

type Row = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests: TestMini;
};

type AttemptRow = {
  id: string | number;
  test_id: string | number;
  user_id?: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests?: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

// Soft timeout that NEVER throws UI-facing errors.
// If it times out, we return `null` and log privately.
async function softTimeout<T>(p: PromiseLike<T>, label: string, ms = 5000): Promise<T | null> {
  let timer: any;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    });
    const result = await Promise.race([p as Promise<T>, timeout]);
    return (result as T) ?? null;
  } catch (e) {
    // Private log only (swap for Sentry.captureException(e))
    console.warn(`[dashboard] ${label} failed:`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        // 1) Fast path: getSession (local, usually instant). If null, we *assume logged out* quietly.
        const sessionRes = await softTimeout(supabase.auth.getSession(), "auth.getSession", 1500);
        const sessionUser = (sessionRes && sessionRes.data?.session?.user) || null;

        // 2) If session is ambiguous/expired, try getUser but don’t block UI forever.
        let user = sessionUser;
        if (!user) {
          const userRes = await softTimeout(supabase.auth.getUser(), "auth.getUser", 3000);
          user = (userRes && (userRes as any).data?.user) || null;
        }

        if (!mounted) return;

        if (!user) {
          // Quietly render logged-out experience (no tech text)
          setUserEmail(null);
          setRows([]);
          return;
        }

        setUserEmail(user.email ?? null);

        // 3) Fetch attempts (no join first). Failures just render empty attempts gracefully.
        const attemptsRes = await softTimeout(
          supabase
            .from("attempts")
            .select("id, test_id, user_id, started_at, finished_at, score")
            .eq("user_id", user.id)
            .order("started_at", { ascending: false }),
          "attempts base",
          4000
        );

        if (!mounted) return;

        let base: AttemptRow[] =
          (attemptsRes && (attemptsRes as any).data) ? (attemptsRes as any).data : [];

        // Build initial rows
        let finalRows: Row[] = base.map((r) => ({
          id: String(r.id),
          test_id: String(r.test_id),
          started_at: r.started_at ?? null,
          finished_at: r.finished_at ?? null,
          score: r.score ?? null,
          tests: null,
        }));

        // 4) Best-effort join (non-blocking). If it fails, we keep base rows.
        const withTestsRes = await softTimeout(
          supabase
            .from("attempts")
            .select("id, test_id, user_id, started_at, finished_at, score, tests(slug, name)")
            .eq("user_id", user.id)
            .order("started_at", { ascending: false }),
          "attempts join tests",
          3000
        );

        if (withTestsRes && (withTestsRes as any).data) {
          const arr = (withTestsRes as any).data as AttemptRow[];
          finalRows = arr.map((r) => {
            const t = Array.isArray(r.tests) ? r.tests[0] ?? null : (r.tests ?? null);
            return {
              id: String(r.id),
              test_id: String(r.test_id),
              started_at: r.started_at ?? null,
              finished_at: r.finished_at ?? null,
              score: r.score ?? null,
              tests: t ? { slug: String(t.slug), name: String(t.name) } : null,
            };
          });
        }

        setRows(finalRows);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // -------- UI (clean, no techy messages) --------
  if (loading) {
    return (
      <PageShell title="Dashboard" subtitle="Your recent activity and quick actions.">
        <div className="card">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-1/3 bg-white/10 rounded" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/10 rounded" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!userEmail) {
    return (
      <PageShell title="Dashboard" subtitle="Please log in to view your attempts.">
        <div className="card flex items-center justify-between gap-3">
          <p className="muted">You’re currently logged out.</p>
          <Link href="/login" className="btn">Log in</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle={`Welcome${userEmail ? `, ${userEmail}` : ""}. Review attempts and jump back in.`}
      actions={
        <div className="flex gap-2">
          <Link className="btn" href={ROUTES.practice}>New Practice Set</Link>
          <Link className="btn-ghost" href={ROUTES.Tests}>All Mock Tests</Link>
        </div>
      }
    >
      {/* Quick links */}
      <div className="grid-3">
        <Link className="card" href={ROUTES.practice}>
          <h3 className="font-semibold">🧠 Take a Practice Test</h3>
          <p className="muted mt-2">Target topics and improve speed.</p>
        </Link>
        <Link className="card" href={ROUTES.Tests}>
          <h3 className="font-semibold">📝 Full Mock Tests</h3>
          <p className="muted mt-2">Real exam simulation with timer & palette.</p>
        </Link>
        <div className="card">
          <h3 className="font-semibold">📈 Tips</h3>
          <p className="muted mt-2">Review weak areas from your last attempt.</p>
          <div className="mt-4 flex gap-2">
            <Link className="btn-ghost" href={ROUTES.practice}>Practice now</Link>
            <Link className="btn-ghost" href={ROUTES.Tests}>See mocks</Link>
          </div>
        </div>
      </div>

      {/* Knowledge links */}
      <div className="section grid-3">
        <Link className="card" href={ROUTES.notes}>
          <h3 className="font-semibold">📒 Notes</h3>
          <p className="muted mt-2">Concise topic notes for quick revision.</p>
        </Link>
        <Link className="card" href={ROUTES.haryanaUpdates}>
          <h3 className="font-semibold">🌾 Haryana Updates</h3>
          <p className="muted mt-2">State news & exam-related notices.</p>
        </Link>
        <Link className="card" href={ROUTES.jobUpdates}>
          <h3 className="font-semibold">📢 Job Updates</h3>
          <p className="muted mt-2">Latest HSSC recruitment alerts.</p>
        </Link>
      </div>

      {/* Attempts */}
      <h2 className="title mt-10">Your Attempts</h2>
      {rows.length === 0 ? (
        <div className="card">
          <p className="muted">No attempts yet. Start with a quick practice set.</p>
          <div className="mt-4">
            <Link className="btn" href={ROUTES.practice}>Start Practice</Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {rows.map((r) => {
            const testName = r.tests?.name ?? "Unknown Test";
            const when = r.started_at ? new Date(r.started_at).toLocaleString() : "";
            const status = r.finished_at ? `Score: ${r.score ?? 0}` : "In progress";
            return (
              <div key={r.id} className="card flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{testName}</div>
                  <div className="muted text-xs mt-1">{when}</div>
                </div>
                <div className="text-sm">{status}</div>
                <Link className="btn-ghost" href={`/results/${r.id}`}>View</Link>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
