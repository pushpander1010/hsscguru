// src/app/results/[attemptId]/page.tsx
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TestMini = { slug: string; name: string } | null;
type AttemptRow = {
  id: string;
  test_id: string;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  tests?: TestMini | TestMini[] | null;
};

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  // Try to fetch attempt via view first, then base tables
  type Run = () => Promise<{ data: AttemptRow | null; error: any }>;
  const runs: Run[] = [
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts_public")
        .select("id,test_id,started_at,finished_at,score,tests:tests_public(slug,name)")
        .eq("id", attemptId)
        .maybeSingle<AttemptRow>();
      return { data, error };
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .schema("api")
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .eq("id", attemptId)
        .maybeSingle<AttemptRow>();
      return { data, error };
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from("attempts")
        .select("id,test_id,started_at,finished_at,score")
        .eq("id", attemptId)
        .maybeSingle<AttemptRow>();
      return { data, error };
    },
  ];

  let attempt: AttemptRow | null = null;
  let lastErr: any = null;
  for (const run of runs) {
    const { data, error } = await run();
    if (!error && data) {
      attempt = data;
      lastErr = null;
      break;
    }
    lastErr = error;
  }

  if (!attempt) {
    return (
      <PageShell title="Result" subtitle="Your test summary">
        <div className="card">
          <div className={lastErr ? "text-red-400" : "text-white/80"}>
            {lastErr?.message ? `Error: ${String(lastErr.message)}` : "No attempt found."}
          </div>
          <div className="mt-3">
            <Link href="/dashboard" className="btn-ghost">← Back to Dashboard</Link>
          </div>
        </div>
      </PageShell>
    );
  }

  let testName = "Unknown Test";
  if (Array.isArray(attempt.tests)) {
    testName = (attempt.tests[0] as any)?.name ?? "Unknown Test";
  } else if (attempt.tests && (attempt.tests as any).name) {
    testName = (attempt.tests as any).name ?? "Unknown Test";
  } else {
    // Enrich tests data if not joined
    let resolvedName: string | null = null;
    const testKey = String(attempt.test_id);

    // 1) api.tests_public by id
    if (!resolvedName) {
      const { data } = await supabaseAdmin
        .schema("api")
        .from("tests_public")
        .select("slug,name")
        .eq("id", testKey)
        .maybeSingle();
      if (data) resolvedName = (data as any).name ?? null;
    }

    // 2) api.tests_public by slug
    if (!resolvedName) {
      const { data } = await supabaseAdmin
        .schema("api")
        .from("tests_public")
        .select("slug,name")
        .eq("slug", testKey)
        .maybeSingle();
      if (data) resolvedName = (data as any).name ?? null;
    }

    // 3) public.tests_public by id
    if (!resolvedName) {
      const { data } = await supabaseAdmin
        .from("tests_public")
        .select("slug,name")
        .eq("id", testKey)
        .maybeSingle();
      if (data) resolvedName = (data as any).name ?? null;
    }

    // 4) public.tests_public by slug
    if (!resolvedName) {
      const { data } = await supabaseAdmin
        .from("tests_public")
        .select("slug,name")
        .eq("slug", testKey)
        .maybeSingle();
      if (data) resolvedName = (data as any).name ?? null;
    }

    // 5) fuzzy match by slug/name (replace dashes with spaces)
    if (!resolvedName) {
      const relaxed = testKey.replace(/-/g, " ");
      const { data } = await supabaseAdmin
        .schema("api")
        .from("tests_public")
        .select("slug,name")
        .or(`slug.ilike.%${relaxed}%,name.ilike.%${relaxed}%`)
        .limit(1);
      if (Array.isArray(data) && data[0]) {
        resolvedName = (data[0] as any).name ?? null;
      }
    }

    if (resolvedName) testName = resolvedName;
  }

  return (
    <PageShell title="Result" subtitle="Your test summary">
      <div className="card space-y-4">
        <div>
          <div className="mb-1 text-sm text-white/60">Test</div>
          <div className="text-lg font-semibold">{testName}</div>
          <div className="text-xs text-white/60 mt-1">Code: {String(attempt.test_id)}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 p-3 bg-[--surface]/80">
            <div className="text-xs text-white/60">Started</div>
            <div className="mt-1 text-sm">
              {attempt.started_at ? new Date(attempt.started_at).toLocaleString() : "N/A"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-3 bg-[--surface]/80">
            <div className="text-xs text-white/60">Finished</div>
            <div className="mt-1 text-sm">
              {attempt.finished_at ? new Date(attempt.finished_at).toLocaleString() : "In progress"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-3 bg-[--surface]/80">
            <div className="text-xs text-white/60">Score</div>
            <div className="mt-1 text-sm">{attempt.score !== null ? attempt.score : "N/A"}</div>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/dashboard" className="btn-ghost">← Back to Dashboard</Link>
        </div>
      </div>
    </PageShell>
  );
}
