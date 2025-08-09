// src/app/tests/page.tsx
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import PageShell from "@/components/PageShell";
import { ROUTES } from "@/lib/routes";

type TestRow = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number | null;
  created_at: string;
};

export default async function TestsPage() {
  const { data, error } = await supabase
    .schema("api")
    .from("tests_public")
    .select("*")
    .order("created_at", { ascending: false });

  const tests = (data ?? []) as TestRow[];

  return (
    <PageShell
      title="Mock Tests"
      subtitle="Real exam simulation with timer, palette, and review."
      actions={
        <div className="flex gap-2">
          <Link className="btn" href={ROUTES.practice}>New Practice Set</Link>
          <Link className="btn-ghost" href={ROUTES.dashboard}>Back to Dashboard</Link>
        </div>
      }
    >
      {/* Quick actions */}
      <div className="grid-3">
        <Link className="card" href={ROUTES.practice}>
          <h3 className="font-semibold">🧠 Practice by Topic</h3>
          <p className="muted mt-2">Randomized questions from selected topics.</p>
        </Link>
        <div className="card">
          <h3 className="font-semibold">⏱️ Pace Tip</h3>
          <p className="muted mt-2">Target ~1 minute per question.</p>
          <div className="mt-4">
            <Link className="btn-ghost" href={ROUTES.practice}>Start Practice</Link>
          </div>
        </div>
        <Link className="card" href={ROUTES.resultsHome ?? "/results"}>
          <h3 className="font-semibold">📊 Results</h3>
          <p className="muted mt-2">Review attempts and focus weak areas.</p>
        </Link>
      </div>

      {/* Tests list */}
      <h2 className="title mt-10">All Mock Tests</h2>

      {error ? (
        <div className="card">
          <p className="muted">We couldn't load tests right now. Please try again.</p>
          <div className="mt-3">
            <Link className="btn-ghost" href={ROUTES.Tests}>Reload</Link>
          </div>
        </div>
      ) : tests.length === 0 ? (
        <div className="card">
          <p className="muted">No tests available yet. Try a practice set for now.</p>
          <div className="mt-4">
            <Link className="btn" href={ROUTES.practice}>Start Practice</Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {tests.map((t) => (
            <Link key={t.id} className="card" href={`/tests/${t.slug}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="muted text-xs mt-1">
                    {(t.duration_minutes ?? 30)} minutes
                  </div>
                </div>
                <span className="btn-ghost">Start</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
