// src/app/results/[attemptId]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type TestMini = { slug: string; name: string } | null;
type AttemptRow = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests: TestMini | TestMini[] | null;
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const { data: attempt, error } = await supabase
    .from("attempts")
    .select("id, test_id, started_at, finished_at, score, tests(slug, name)")
    .eq("id", attemptId)
    .limit(1)
    .maybeSingle<AttemptRow>();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Result</h1>
        <div className="rounded-xl2 border border-border bg-bg-card p-4 text-red-500">
          Error loading attempt: {error.message}
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl2 border border-border bg-bg-card px-3 py-2 text-sm shadow-soft hover:ring-1 hover:ring-ring/30"
              href="/dashboard">← Back to Dashboard</Link>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Result</h1>
        <div className="rounded-xl2 border border-border bg-bg-card p-4">
          No attempt found.
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl2 border border-border bg-bg-card px-3 py-2 text-sm shadow-soft hover:ring-1 hover:ring-ring/30"
              href="/dashboard">← Back to Dashboard</Link>
      </div>
    );
  }

  let testName = "Unknown Test";
  if (Array.isArray(attempt.tests)) {
    testName = attempt.tests[0]?.name ?? "Unknown Test";
  } else if (attempt.tests && "name" in attempt.tests) {
    testName = attempt.tests.name ?? "Unknown Test";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Result</h1>
        <Link
          className="inline-flex items-center gap-2 rounded-xl2 border border-border bg-bg-card px-3 py-2 text-sm shadow-soft hover:ring-1 hover:ring-ring/30"
          href="/dashboard"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <section className="rounded-xl2 border border-border bg-bg-card p-5 shadow-soft">
        <div className="mb-1 text-sm font-medium text-fg-muted">Test</div>
        <div className="text-lg font-semibold">{testName}</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-bg-muted p-3">
            <div className="text-xs text-fg-muted">Started</div>
            <div className="mt-1 text-sm">
              {attempt.started_at
                ? new Date(attempt.started_at).toLocaleString()
                : "N/A"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-bg-muted p-3">
            <div className="text-xs text-fg-muted">Finished</div>
            <div className="mt-1 text-sm">
              {attempt.finished_at
                ? new Date(attempt.finished_at).toLocaleString()
                : "In progress"}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-bg-muted p-3">
            <div className="text-xs text-fg-muted">Score</div>
            <div className="mt-1 text-sm">
              {attempt.score !== null ? attempt.score : "N/A"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
